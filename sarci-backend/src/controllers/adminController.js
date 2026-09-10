import prisma from '../config/db.js';
import { success } from '../utils/response.js';
import { INGENIEROS } from '../config/horarios.js';

const USUARIO_PUBLICO = {
  id: true, nombre: true, apellido: true, email: true,
  cedula: true, rol: true, telefono: true,
  facultad: true, carrera: true, cargo: true, departamento: true,
};

export const getDashboard = async (_req, res) => {
  const [totalTickets, ticketsPorEstado, ingenierosConConteo, ticketsRecientes] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.groupBy({
      by: ['estado'],
      _count: { estado: true },
    }),
    Promise.all(
      INGENIEROS.map(async (ingeniero) => {
        const [citasActivas, ticketsAsignados] = await Promise.all([
          prisma.citaPersonal.count({
            where: {
              ingenieroId: ingeniero.id,
              estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
            },
          }),
          prisma.citaPersonal.findMany({
            where: {
              ingenieroId: ingeniero.id,
              estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
            },
            include: {
              ticket: {
                include: {
                  usuario: { select: USUARIO_PUBLICO },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          ...ingeniero,
          usuariosEnEspera: citasActivas,
          tickets: ticketsAsignados.map((cita) => ({
            ...cita.ticket,
            citaId: cita.id,
            fechaAsignada: cita.fechaAsignada,
            horaAsignada: cita.horaAsignada,
          })),
        };
      })
    ),
    prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        usuario: { select: USUARIO_PUBLICO },
        asignadoA: { select: { id: true, nombre: true, apellido: true } },
        citaPersonal: { select: { ingenieroNombre: true, ingenieroId: true, fechaAsignada: true, horaAsignada: true, estado: true } },
      },
    }),
  ]);

  const estadoMap = {};
  ticketsPorEstado.forEach((e) => { estadoMap[e.estado] = e._count.estado; });

  return success(res, 200, 'Dashboard administrativo', {
    resumen: {
      totalTickets,
      ticketsPorEstado: estadoMap,
      pendientes: estadoMap.PENDIENTE || 0,
      enProceso: estadoMap.EN_PROCESO || 0,
      atendidos: estadoMap.ATENDIDO || 0,
      resueltos: estadoMap.RESUELTO || 0,
    },
    ingenieros: ingenierosConConteo,
    ticketsRecientes,
  });
};

export const getAllTickets = async (req, res) => {
  const { page = 1, limit = 20, estado, buscar } = req.query;

  const where = {};
  if (estado) {
    if (estado === 'ATENDIDO,RESUELTO') {
      where.estado = { in: ['ATENDIDO', 'RESUELTO'] };
    } else {
      where.estado = estado;
    }
  }
  if (buscar) {
    where.OR = [
      { titulo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
      { usuario: { cedula: { contains: buscar, mode: 'insensitive' } } },
    ];
  }

  const [tickets, totalItems] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        usuario: { select: USUARIO_PUBLICO },
        asignadoA: { select: { id: true, nombre: true, apellido: true } },
        categoria: { select: { id: true, nombre: true } },
        citaPersonal: { select: { ingenieroNombre: true, ingenieroId: true, fechaAsignada: true, horaAsignada: true, estado: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.ticket.count({ where }),
  ]);

  return success(res, 200, 'Tickets obtenidos', tickets, {
    page: Number(page),
    limit: Number(limit),
    totalItems,
    totalPages: Math.ceil(totalItems / Number(limit)),
  });
};

export const getTicketsByIngeniero = async (req, res) => {
  const { ingenieroId } = req.params;

  const ingeniero = INGENIEROS.find((i) => i.id === ingenieroId);
  if (!ingeniero) {
    return res.status(404).json({ success: false, message: 'Ingeniero no encontrado' });
  }

  const citas = await prisma.citaPersonal.findMany({
    where: {
      ingenieroId,
      estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
    },
    include: {
      ticket: {
        include: {
          usuario: { select: USUARIO_PUBLICO },
          _count: { select: { comentarios: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(res, 200, `Tickets de ${ingeniero.nombre}`, {
    ingeniero,
    tickets: citas.map((cita) => ({
      ...cita.ticket,
      cita: {
        id: cita.id,
        fechaAsignada: cita.fechaAsignada,
        horaAsignada: cita.horaAsignada,
        estado: cita.estado,
      },
    })),
  });
};
