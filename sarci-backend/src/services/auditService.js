import prisma from '../config/db.js';

export const listAuditLogs = async ({ page = 1, limit = 20, userId, accion, ticketId, fechaDesde, fechaHasta }) => {
  const where = {};

  if (userId) where.userId = userId;
  if (accion) where.accion = accion;
  if (ticketId) where.ticketId = ticketId;
  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
    if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
  }

  const [logs, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true, cedula: true, facultad: true, carrera: true } },
        ticket: { select: { id: true, numero: true, titulo: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: logs,
    meta: {
      page: Number(page), limit: Number(limit),
      totalItems, totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getStats = async () => {
  const [
    totalUsuarios, totalTickets, ticketsPorEstado, ticketsPorPrioridad,
    ticketsHoy, logsHoy,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.ticket.groupBy({ by: ['prioridad'], _count: { prioridad: true } }),
    prisma.ticket.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  const resueltos = await prisma.ticket.findMany({
    where: { resueltoEn: { not: null } },
    select: { createdAt: true, resueltoEn: true },
    take: 100,
  });

  const avgResolution = resueltos.length > 0
    ? resueltos.reduce((sum, t) => sum + (Math.abs(new Date(t.resueltoEn) - new Date(t.createdAt)) / (1000 * 60 * 60)), 0) / resueltos.length
    : 0;

  return {
    usuarios: { total: totalUsuarios },
    tickets: {
      total: totalTickets,
      hoy: ticketsHoy,
      porEstado: Object.fromEntries(ticketsPorEstado.map(e => [e.estado, e._count.estado])),
      porPrioridad: Object.fromEntries(ticketsPorPrioridad.map(e => [e.prioridad, e._count.prioridad])),
      promedioResolucionHoras: Math.round(avgResolution * 100) / 100,
    },
    actividad: { logsHoy },
  };
};
