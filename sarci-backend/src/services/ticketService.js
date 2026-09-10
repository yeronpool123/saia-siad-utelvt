import prisma from '../config/db.js';
import { generateTicketNumber } from '../utils/helpers.js';
import { auditLog } from '../middlewares/audit.js';
import config from '../config/app.js';
import { verifyQrPayload } from '../utils/qrToken.js';
import { emitTicketEvent } from '../config/socket.js';

export const listTickets = async ({ userId, rol, page = 1, limit = 10, estado, prioridad, tipo, asignadoA, buscar }) => {
  const where = {};

  if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    where.userId = userId;
  }

  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;
  if (tipo) where.tipo = tipo;
  if (asignadoA) where.asignadoAId = asignadoA;

  if (buscar) {
    where.OR = [
      { titulo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
    ];
  }

  const [tickets, totalItems] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true } },
        asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
        categoria: { select: { id: true, nombre: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: tickets,
    meta: {
      page: Number(page), limit: Number(limit),
      totalItems, totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getTicketById = async (id, userId, rol) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true, telefono: true, departamento: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true, descripcion: true } },
      comentarios: {
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, rol: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      auditLogs: {
        select: { id: true, accion: true, detalles: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!ticket) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    if (ticket.userId !== userId) {
      throw { statusCode: 403, message: 'No tiene permiso para ver este ticket' };
    }
    ticket.comentarios = ticket.comentarios.filter(c => !c.interno);
  }

  return ticket;
};

export const createTicket = async ({ data, userId, req }) => {
  const ticketsAbiertos = await prisma.ticket.count({
    where: { userId, estado: { in: ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA'] } },
  });

  const maxConfig = await prisma.configuracionSistema.findUnique({ where: { clave: 'max_tickets_abiertos' } });
  const maxTickets = maxConfig ? parseInt(maxConfig.valor, 10) : 5;

  if (ticketsAbiertos >= maxTickets) {
    throw { statusCode: 409, message: `Ha alcanzado el límite de ${maxTickets} tickets abiertos simultáneamente. Espere a que se resuelvan algunos.` };
  }

  const ticketCount = await prisma.ticket.count();
  const numero = generateTicketNumber(ticketCount + 1);

  const existingNumber = await prisma.ticket.findUnique({ where: { numero } });
  const finalNumero = existingNumber ? generateTicketNumber(ticketCount + 2) : numero;

  const ticketData = {
    numero: finalNumero,
    titulo: data.titulo,
    descripcion: data.descripcion,
    tipo: data.tipo,
    prioridad: data.prioridad || 'MEDIA',
    userId,
    categoriaId: data.categoriaId || null,
    adjuntos: data.adjuntos || null,
    metadata: {
      cedula: data.cedula || null,
      atencionEnPersona: data.atencionEnPersona || false,
      ...(data.metadata || {}),
    },
  };

  if (data.fotoCedulaUrl) {
    ticketData.fotoCedulaUrl = data.fotoCedulaUrl;
  }

  const ticket = await prisma.ticket.create({
    data: ticketData,
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true, cedula: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  await auditLog({ userId, accion: 'CREAR_TICKET', ticketId: ticket.id, detalles: `Ticket creado: ${finalNumero}`, req, datosNuevos: data });

  if (config.n8nWebhookUrl) {
    const { usuario: u } = ticket;
    const payload = {
      fecha: ticket.createdAt?.toISOString() || new Date().toISOString(),
      nombres: [u.nombre, u.apellido].filter(Boolean).join(' '),
      cedula: data.cedula || u.cedula || '',
      requerimiento: ticket.tipo || '',
      descripcion: ticket.descripcion,
      fotoCedula: data.fotoCedulaUrl || ticket.fotoCedulaUrl || '',
      atencionEnPersona: data.atencionEnPersona || false,
      ingenieroAsignado: data.ingenieroAsignado || '',
    };

    const sendWebhook = (url) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

    const primaryUrl = config.n8nWebhookUrl;
    const fallbackUrl = primaryUrl.includes('localhost')
      ? primaryUrl.replace('localhost', '127.0.0.1')
      : null;

    sendWebhook(primaryUrl).catch((primaryErr) => {
      console.warn('[WEBHOOK] Fallo con localhost, intentando 127.0.0.1:', primaryErr.message);
      if (fallbackUrl) {
        sendWebhook(fallbackUrl).catch((fallbackErr) =>
          console.error('[WEBHOOK] Definitivo — ambos intentos fallaron:', fallbackErr)
        );
      } else {
        console.error('[WEBHOOK] Definitivo — error original:', primaryErr);
      }
    });
  }

  return ticket;
};

export const updateTicket = async ({ id, data, userId, rol, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (previo.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para actualizar este ticket' };
  }

  const updateData = {};
  const allowedFields = ['titulo', 'descripcion', 'categoriaId', 'adjuntos'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  await auditLog({ userId, accion: 'ACTUALIZAR_TICKET', ticketId: id, detalles: `Ticket actualizado: ${previo.numero}`, req, datosPrevios: previo, datosNuevos: updateData });

  return ticket;
};

export const changeStatus = async ({ id, estado, resolucion, asignadoAId, userId, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  const updateData = { estado };

  if (estado === 'RESUELTO') {
    updateData.resolucion = resolucion || previo.resolucion || 'Ticket resuelto';
    updateData.resueltoEn = new Date();
    updateData.cerradoEn = new Date();
  }

  if (estado === 'CERRADO') {
    updateData.cerradoEn = new Date();
  }

  if (asignadoAId) {
    updateData.asignadoAId = asignadoAId;
  }

  if (estado === 'EN_PROCESO' && !previo.respuestaEn) {
    updateData.respuestaEn = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  const accionMap = {
    'EN_PROCESO': 'CAMBIAR_ESTADO_TICKET',
    'ESPERANDO_RESPUESTA': 'CAMBIAR_ESTADO_TICKET',
    'RESUELTO': 'CERRAR_TICKET',
    'CERRADO': 'CERRAR_TICKET',
    'RECHAZADO': 'RECHAZAR_TICKET',
    'PENDIENTE': 'CAMBIAR_ESTADO_TICKET',
  };

  await auditLog({
    userId, accion: accionMap[estado] || 'CAMBIAR_ESTADO_TICKET',
    ticketId: id,
    detalles: `Estado de ticket "${previo.numero}" cambiado de "${previo.estado}" a "${estado}"`,
    req, datosPrevios: { estado: previo.estado }, datosNuevos: { estado },
  });

  return ticket;
};

export const deleteTicket = async ({ id, userId, rol, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (previo.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para eliminar este ticket' };
  }

  await prisma.ticket.update({
    where: { id },
    data: { estado: 'RECHAZADO', resolucion: 'Eliminado por el usuario' },
  });

  await auditLog({ userId, accion: 'RECHAZAR_TICKET', ticketId: id, detalles: `Ticket eliminado (rechazado): ${previo.numero}`, req });

  return { message: 'Ticket eliminado exitosamente' };
};

export const addComment = async ({ ticketId, contenido, interno, userId, rol, req }) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (ticket.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para comentar en este ticket' };
  }

  const esInterno = (rol === 'SOPORTE_TI' || rol === 'SUPER_ADMIN') ? (interno || false) : false;

  const comentario = await prisma.comentario.create({
    data: {
      contenido, interno: esInterno,
      ticketId, userId,
    },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, rol: true } },
    },
  });

  if ((rol === 'SOPORTE_TI' || rol === 'SUPER_ADMIN') && !ticket.respuestaEn) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { respuestaEn: new Date() },
    });
  }

  await auditLog({ userId, accion: 'CREAR_COMENTARIO', ticketId, detalles: `Comentario agregado al ticket ${ticket.numero}`, req });

  return comentario;
};

export const verifyQr = async ({ payload, userId, req }) => {
  const data = verifyQrPayload(payload);

  const ticket = await prisma.ticket.findUnique({
    where: { id: data.t },
    include: {
      usuario: {
        select: {
          id: true, nombre: true, apellido: true, email: true,
          cedula: true, rol: true, facultad: true, carrera: true, cargo: true,
        },
      },
      citaPersonal: {
        select: {
          id: true, ingenieroNombre: true, ingenieroId: true,
          fechaAsignada: true, horaAsignada: true, estado: true,
        },
      },
      asignadoA: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  if (!ticket) {
    throw { statusCode: 404, message: 'Ticket no encontrado. Verifique el código QR.' };
  }

  if (ticket.estado === 'ATENDIDO' && ticket.atendidoEn) {
    const atendidoEnLocal = new Date(ticket.atendidoEn).toLocaleString('es-EC', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    const error = new Error(`Atendido previamente el ${atendidoEnLocal}`);
    error.statusCode = 409;
    error.code = 'TICKET_YA_ATENDIDO';
    error.data = {
      ticketId: ticket.id,
      numero: ticket.numero,
      atendidoEn: ticket.atendidoEn,
      atendidoEnLocal,
      estado: ticket.estado,
    };
    throw error;
  }

  const ahora = new Date();
  const cita = ticket.citaPersonal;

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        estado: 'ATENDIDO',
        atendidoEn: ahora,
        resueltoEn: ahora,
        cerradoEn: ahora,
        resolucion: 'Ticket validado presencialmente mediante código QR.',
      },
    }),
    ...(cita
      ? [prisma.citaPersonal.update({
          where: { id: cita.id },
          data: { estado: 'COMPLETADA' },
        })]
      : []),
  ]);

  await auditLog({
    userId,
    accion: 'CAMBIAR_ESTADO_TICKET',
    ticketId: ticket.id,
    detalles: `Ticket "${ticket.numero}" validado por QR -> ATENDIDO`,
    req,
    datosPrevios: { estado: ticket.estado },
    datosNuevos: { estado: 'ATENDIDO', validadoPorQR: true },
  });

  const atendidoEnLocal = ahora.toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });

  const resultado = {
    id: ticket.id,
    numero: ticket.numero,
    estado: 'ATENDIDO',
    atendidoEn: ahora,
    atendidoEnLocal,
    usuario: {
      nombre: ticket.usuario?.nombre,
      apellido: ticket.usuario?.apellido,
      cedula: ticket.usuario?.cedula,
      email: ticket.usuario?.email,
      rol: ticket.usuario?.rol,
      facultad: ticket.usuario?.facultad,
      carrera: ticket.usuario?.carrera,
    },
    especialista: cita?.ingenieroNombre || ticket.asignadoA?.nombre || 'No asignado',
    especialistaId: cita?.ingenieroId || null,
    fechaCita: cita?.fechaAsignada || null,
    horaCita: cita?.horaAsignada || null,
  };

  emitTicketEvent('ticket:atendido', {
    ticketId: ticket.id,
    numero: ticket.numero,
    estado: 'ATENDIDO',
    atendidoEn: ahora,
  });
  emitTicketEvent('dashboard:refresh', { motivo: 'ticket:atendido', numero: ticket.numero });

  return resultado;
};
