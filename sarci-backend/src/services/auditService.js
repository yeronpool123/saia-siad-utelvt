import prisma from '../config/db.js';

export const listAuditLogs = async ({ page = 1, limit = 20, userId, accion, ticketId, fechaDesde, fechaHasta }) => {
  const pageNum = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 50;
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
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: logs,
    meta: {
      page: pageNum, limit: pageSize,
      totalItems, totalPages: Math.ceil(totalItems / pageSize),
      hasNextPage: pageNum < Math.ceil(totalItems / pageSize),
      hasPrevPage: pageNum > 1,
    },
  };
};

export const getStats = async () => {
  const [
    totalUsuarios, totalTickets, ticketsParaEstado, ticketsParaPrioridad,
    ticketsHoy, logsHoy,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.ticket.count(),
    prisma.ticket.findMany({ select: { estado: true } }),
    prisma.ticket.findMany({ select: { prioridad: true } }),
    prisma.ticket.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  const agrupar = (rows, campo) =>
    rows.reduce((acc, fila) => {
      const clave = fila[campo] || 'SIN_DATO';
      acc[clave] = (acc[clave] || 0) + 1;
      return acc;
    }, {});

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
      porEstado: agrupar(ticketsParaEstado, 'estado'),
      porPrioridad: agrupar(ticketsParaPrioridad, 'prioridad'),
      promedioResolucionHoras: Math.round(avgResolution * 100) / 100,
    },
    actividad: { logsHoy },
  };
};
