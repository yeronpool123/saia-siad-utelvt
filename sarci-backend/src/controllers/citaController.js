import prisma from '../config/db.js';
import { success, badRequest, notFound, conflict } from '../utils/response.js';
import { auditLog } from '../middlewares/audit.js';
import { generateQrPayload } from '../utils/qrToken.js';
import { emitTicketEvent } from '../config/socket.js';
import {
  INGENIEROS,
  BLOQUES_HORARIOS,
  TOPE_INGENIERO_POR_HORA,
  getBloqueByLabel,
  getCapacidadBloque,
  getCapacidadIngenieroParaBloque,
  esDiaLaborable,
  isDiaNoLaborable,
} from '../config/horarios.js';

const TOTAL_INGENIEROS = INGENIEROS.length;

const parseFecha = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`);
  return d;
};

const dayRange = (fecha) => {
  const fechaConsulta = parseFecha(fecha);
  const inicioDia = new Date(fechaConsulta);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(fechaConsulta);
  finDia.setHours(23, 59, 59, 999);
  return { inicioDia, finDia };
};

const contarCitas = async ({ fecha, hora, ingenieroId = null }) => {
  const { inicioDia, finDia } = dayRange(fecha);
  return prisma.citaPersonal.count({
    where: {
      ...(ingenieroId ? { ingenieroId } : {}),
      fechaAsignada: { gte: inicioDia, lte: finDia },
      horaAsignada: hora,
      estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
    },
  });
};

export const getIngenieros = async (req, res) => {
  const { fecha, hora } = req.query;

  const ingenierosConConteo = await Promise.all(
    INGENIEROS.map(async (ingeniero) => {
      const [count, countPorHora] = await Promise.all([
        prisma.citaPersonal.count({
          where: {
            ingenieroId: ingeniero.id,
            estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
          },
        }),
        fecha && hora ? contarCitas({ fecha, hora, ingenieroId: ingeniero.id }) : Promise.resolve(0),
      ]);

      const capacidadBloque = fecha && hora ? getCapacidadIngenieroParaBloque(hora) : TOPE_INGENIERO_POR_HORA;
      const cuposDisponibles = Math.max(0, capacidadBloque - countPorHora);
      const ocupado = capacidadBloque > 0 && countPorHora >= capacidadBloque;

      return {
        ...ingeniero,
        usuariosEnEspera: count,
        cuposDisponibles,
        capacidadBloque,
        ocupado,
      };
    })
  );

  return success(res, 200, 'Especialistas obtenidos exitosamente', ingenierosConConteo);
};

export const getHorariosDisponibles = async (req, res) => {
  const { ingenieroId } = req.params;
  const { fecha } = req.query;

  if (!ingenieroId || !fecha) {
    return badRequest(res, 'Se requiere ingenieroId y fecha');
  }

  const ingeniero = INGENIEROS.find((i) => i.id === ingenieroId);
  if (!ingeniero) {
    return notFound(res, 'Ingeniero no encontrado');
  }

  if (isDiaNoLaborable(fecha)) {
    return success(res, 200, 'Día no laborable', {
      ingeniero,
      fecha,
      horarios: [],
      motivo: 'Fin de semana o feriado registrado',
    });
  }

  const horarios = await Promise.all(
    BLOQUES_HORARIOS.map(async (bloque) => {
      const ocupados = await contarCitas({ fecha, hora: bloque.label, ingenieroId });
      const capacidad = getCapacidadIngenieroParaBloque(bloque.label);
      const libres = Math.max(0, capacidad - ocupados);
      return {
        hora: bloque.label,
        capacidad,
        ocupados,
        libres,
        bloqueado: libres <= 0,
        jornada: bloque.jornada,
      };
    })
  );

  return success(res, 200, 'Horarios obtenidos', { ingeniero, fecha, horarios });
};

export const getDisponibilidad = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return badRequest(res, 'Se requiere el parametro fecha (YYYY-MM-DD)');
  }

  if (isDiaNoLaborable(fecha)) {
    return success(res, 200, 'Día no laborable', {
      fecha,
      horarios: [],
      diaNoLaborable: true,
      motivo: 'Fin de semana o feriado institucional',
    });
  }

  const citasDelDia = await prisma.citaPersonal.findMany({
    where: {
      fechaAsignada: {
        gte: dayRange(fecha).inicioDia,
        lte: dayRange(fecha).finDia,
      },
      estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
    },
    select: { ingenieroId: true, horaAsignada: true },
  });

  const ocupacion = {};
  BLOQUES_HORARIOS.forEach((bloque) => {
    ocupacion[bloque.label] = { ocupados: 0, libres: bloque.capacidad, capacidad: bloque.capacidad };
  });

  citasDelDia.forEach((cita) => {
    const slot = ocupacion[cita.horaAsignada];
    if (slot) {
      slot.ocupados += 1;
      slot.libres = Math.max(0, slot.capacidad - slot.ocupados);
    }
  });

  const horarios = BLOQUES_HORARIOS.map((bloque) => {
    const slot = ocupacion[bloque.label];
    return {
      id: bloque.id,
      hora: bloque.label,
      inicio: bloque.inicio,
      ...slot,
      bloqueado: slot.libres <= 0,
      jornada: bloque.jornada,
    };
  });

  return success(res, 200, 'Disponibilidad obtenida', { fecha, horarios });
};

export const crearCita = async (req, res) => {
  const { ticketId, ingenieroId, fecha, hora } = req.body;

  if (!ticketId || !ingenieroId || !fecha || !hora) {
    return badRequest(res, 'Se requiere ticketId, ingenieroId, fecha y hora');
  }

  if (!esDiaLaborable(fecha)) {
    return conflict(res, 'No se pueden agendar citas en fines de semana o feriados institucionales.');
  }

  const bloque = getBloqueByLabel(hora);
  if (!bloque) {
    return badRequest(res, `El bloque horario "${hora}" no es válido. Use el formato HH:mm AM/PM (ej. 08:00 AM - 09:00 AM).`);
  }

  const ingeniero = INGENIEROS.find((i) => i.id === ingenieroId);
  if (!ingeniero) {
    return notFound(res, 'Ingeniero no encontrado');
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return notFound(res, 'Ticket no encontrado');
  }

  const existingCita = await prisma.citaPersonal.findUnique({ where: { ticketId } });
  if (existingCita) {
    return conflict(res, 'Este ticket ya tiene una cita asignada');
  }

  const { inicioDia, finDia } = dayRange(fecha);

  const [ocupadasGlobal, ocupadasIngeniero] = await Promise.all([
    prisma.citaPersonal.count({
      where: {
        fechaAsignada: { gte: inicioDia, lte: finDia },
        horaAsignada: hora,
        estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
      },
    }),
    prisma.citaPersonal.count({
      where: {
        ingenieroId,
        fechaAsignada: { gte: inicioDia, lte: finDia },
        horaAsignada: hora,
        estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
      },
    }),
  ]);

  const capacidadGlobal = getCapacidadBloque(hora);
  if (ocupadasGlobal >= capacidadGlobal) {
    return conflict(res, `El bloque ${hora} ha completado su aforo de ${capacidadGlobal} ticket(s). Por favor, selecciona otro horario.`);
  }

  const capacidadIngeniero = getCapacidadIngenieroParaBloque(hora);
  if (ocupadasIngeniero >= capacidadIngeniero) {
    return conflict(res, 'El especialista seleccionado ha completado su aforo para este horario. Por favor, selecciona otro especialista u otro bloque de tiempo.');
  }

  const cita = await prisma.citaPersonal.create({
    data: {
      ingenieroNombre: ingeniero.nombre,
      ingenieroId,
      fechaAsignada: inicioDia,
      horaAsignada: hora,
      ticketId,
    },
    include: {
      ticket: {
        select: { id: true, numero: true, titulo: true, estado: true },
      },
    },
  });

  await auditLog({
    userId: req.user.id,
    accion: 'CREAR_CITA',
    ticketId,
    detalles: `Cita creada: ${ingeniero.nombre} - ${fecha} ${hora}`,
    req,
    datosNuevos: { ingenieroId, fecha, hora },
  });

  const cedula = ticket.metadata?.cedula || ticket.cedula || (await prisma.usuario.findUnique({ where: { id: ticket.userId } }))?.cedula || '';

  const qrPayload = generateQrPayload({
    ticketId: ticket.id,
    numero: ticket.numero,
    cedula,
  });

  emitTicketEvent('cita:creada', {
    ticketId: ticket.id,
    numero: ticket.numero,
    ingenieroId,
    fecha,
    hora,
  });
  emitTicketEvent('dashboard:refresh', { motivo: 'cita:creada', numero: ticket.numero });

  return success(res, 201, 'Cita creada exitosamente', {
    cita,
    ticketDigital: {
      codigo: ticket.numero,
      ingeniero: ingeniero.nombre,
      especialidad: ingeniero.especialidad,
      fecha,
      hora,
      cedula,
      qrPayload,
    },
  });
};

export const cancelarCita = async (req, res) => {
  const { id } = req.params;

  const cita = await prisma.citaPersonal.findUnique({ where: { id } });
  if (!cita) {
    return notFound(res, 'Cita no encontrada');
  }

  const actualizada = await prisma.citaPersonal.update({
    where: { id },
    data: { estado: 'CANCELADA' },
  });

  await auditLog({
    userId: req.user.id,
    accion: 'CANCELAR_CITA',
    ticketId: cita.ticketId,
    detalles: `Cita cancelada: ${cita.ingenieroNombre} - ${cita.fechaAsignada} ${cita.horaAsignada}`,
    req,
  });

  return success(res, 200, 'Cita cancelada', actualizada);
};