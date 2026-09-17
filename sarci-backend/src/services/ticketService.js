import prisma from '../config/db.js';
import { generateTicketNumber } from '../utils/helpers.js';
import { auditLog } from '../middlewares/audit.js';
import config from '../config/app.js';
import { verifyQrPayload } from '../utils/qrToken.js';
import { emitTicketEvent, emitToTicketRoom } from '../config/socket.js';

const ROLES_SOPORTE = ['SOPORTE_TI', 'SUPER_ADMIN'];
const ESTADOS_TERMINALES = ['RESUELTO', 'CERRADO', 'ATENDIDO', 'RECHAZADO', 'CANCELADO_USUARIO'];
const ESTADOS_CANCELABLES_POR_USUARIO = ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA'];

const MAPA_ESTADOS = {
  PENDING: 'PENDIENTE',
  IN_PROGRESS: 'EN_PROCESO',
  APPROVED: 'RESUELTO',
  CANCELLED_ADMIN: 'RECHAZADO',
  SPECIAL_CASE: 'CASO_ESPECIAL',
  CANCELLED_USER: 'CANCELADO_USUARIO',
};

const normalizarEstado = (estado) => MAPA_ESTADOS[estado] || estado;

const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA', 'RESUELTO', 'CERRADO', 'RECHAZADO', 'ATENDIDO', 'CASO_ESPECIAL', 'CANCELADO_USUARIO'];
const PRIORIDADES_VALIDAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const TIPOS_VALIDOS = ['RESETEO_SIAD', 'RESETEO_CORREO', 'DESBLOQUEO_CUENTA', 'ACCESO_PLATAFORMA', 'PROBLEMA_EQUIPO', 'SOLICITUD_SOFTWARE', 'CONFIGURACION_RED', 'OTRO'];

export const listTickets = async ({ userId, rol, page = 1, limit = 10, estado, prioridad, tipo, asignadoA, buscar, cedula }) => {
  const pagina = Math.max(parseInt(page, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const where = {};

  if (cedula && cedula.trim()) {
    const usuarioPorCedula = await prisma.usuario.findUnique({ where: { cedula: cedula.trim() } });
    if (usuarioPorCedula) where.userId = usuarioPorCedula.id;
    else return { items: [], meta: { page: pagina, limit: limite, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  } else if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    where.userId = userId;
  }

  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) throw { statusCode: 400, message: `Estado invalido: "${estado}"` };
    where.estado = estado;
  }
  if (prioridad) {
    if (!PRIORIDADES_VALIDAS.includes(prioridad)) throw { statusCode: 400, message: `Prioridad invalida: "${prioridad}"` };
    where.prioridad = prioridad;
  }
  if (tipo) {
    if (!TIPOS_VALIDOS.includes(tipo)) throw { statusCode: 400, message: `Tipo de soporte invalido: "${tipo}"` };
    where.tipo = tipo;
  }
  if (asignadoA) where.asignadoAId = asignadoA;

  if (buscar) {
    where.OR = [
      { titulo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
      { usuario: { cedula: { contains: buscar, mode: 'insensitive' } } },
      { usuario: { email: { contains: buscar, mode: 'insensitive' } } },
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
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: tickets,
    meta: {
      page: pagina, limit: limite,
      totalItems, totalPages: Math.ceil(totalItems / limite),
      hasNextPage: pagina < Math.ceil(totalItems / limite),
      hasPrevPage: pagina > 1,
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
    notificarN8N(config.n8nWebhookUrl, ticket, data);
  }

  return ticket;
};

function notificarN8N(baseUrl, ticket, data) {
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

  const post = (url) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });

  const fallbackUrl = baseUrl.includes('localhost')
    ? baseUrl.replace('localhost', '127.0.0.1')
    : null;

  const attempts = fallbackUrl ? [baseUrl, fallbackUrl] : [baseUrl];
  const chain = attempts.reduce((acc, url) => acc.catch(() => post(url)), Promise.reject());

  // "Fuego y olvido": si n8n no está disponible, se registra y el flujo continúa
  chain.catch((err) =>
    console.warn('[WEBHOOK] No notificado a n8n (se continua con el flujo normal):', err.message)
  );
}

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

export const changeStatus = async ({ id, estado, status, resolucion, resolutionNotes, cancellationReason, asignadoAId, userId, req }) => {
  const estadoFinal = normalizarEstado(estado || status);
  if (!estadoFinal) throw { statusCode: 400, message: 'El estado es obligatorio' };

  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (ESTADOS_TERMINALES.includes(previo.estado)) {
    throw { statusCode: 409, message: 'El ticket está en un estado terminal y no puede modificarse' };
  }

  const nota = resolutionNotes || resolucion;

  const updateData = { estado: estadoFinal, isSpecialCase: false };

  if (estadoFinal === 'RESUELTO') {
    updateData.resolucion = nota || previo.resolucion || 'Ticket resuelto';
    updateData.resueltoEn = new Date();
    updateData.cerradoEn = new Date();
  }

  if (estadoFinal === 'RECHAZADO' || estadoFinal === 'CANCELADO_USUARIO') {
    updateData.cancellationReason = cancellationReason || nota || 'Rechazado por el administrador';
  }

  if (estadoFinal === 'CASO_ESPECIAL') {
    updateData.isSpecialCase = true;
    updateData.resolucion = nota || previo.resolucion || 'Requiere atención presencial prioritaria.';
  }

  if (estadoFinal === 'CERRADO') {
    updateData.cerradoEn = new Date();
  }

  if (asignadoAId) {
    updateData.asignadoAId = asignadoAId;
  }

  if (estadoFinal === 'EN_PROCESO' && !previo.respuestaEn) {
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
    'CANCELADO_USUARIO': 'CANCELAR_TICKET',
    'CASO_ESPECIAL': 'CAMBIAR_ESTADO_TICKET',
    'PENDIENTE': 'CAMBIAR_ESTADO_TICKET',
  };

  await auditLog({
    userId, accion: accionMap[estadoFinal] || 'CAMBIAR_ESTADO_TICKET',
    ticketId: id,
    detalles: `Estado de ticket "${previo.numero}" cambiado de "${previo.estado}" a "${estadoFinal}"`,
    req, datosPrevios: { estado: previo.estado }, datosNuevos: { estado: estadoFinal },
  });

  emitToTicketRoom(id, 'ticket_status_changed', {
    ticketId: id,
    numero: previo.numero,
    newStatus: estadoFinal,
    updatedBy: userId,
  });
  emitTicketEvent('dashboard:refresh', { motivo: 'ticket:status', numero: previo.numero });

  return ticket;
};

export const cancelByUser = async ({ id, reason, userId, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (previo.userId !== userId) {
    throw { statusCode: 403, message: 'Solo el solicitante puede cancelar su propio tramite' };
  }

  if (!ESTADOS_CANCELABLES_POR_USUARIO.includes(previo.estado)) {
    throw {
      statusCode: 409,
      message: `Solo se puede cancelar un tramite pendiente o en proceso (estado actual: "${previo.estado}")`,
    };
  }

  const motivo = String(reason || '').trim();
  if (!motivo) throw { statusCode: 400, message: 'Debe indicar el motivo de la cancelacion' };

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      estado: 'CANCELADO_USUARIO',
      cancellationReason: motivo,
      isSpecialCase: false,
    },
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  await auditLog({
    userId, accion: 'CANCELAR_TICKET',
    ticketId: id,
    detalles: `El usuario cancelo su tramite "${previo.numero}"`,
    req,
    datosPrevios: { estado: previo.estado },
    datosNuevos: { estado: 'CANCELADO_USUARIO', reason: motivo },
  });

  emitToTicketRoom(id, 'ticket_status_changed', {
    ticketId: id,
    numero: previo.numero,
    newStatus: 'CANCELADO_USUARIO',
    updatedBy: userId,
  });
  emitTicketEvent('dashboard:refresh', { motivo: 'ticket:cancelado', numero: previo.numero });

  return ticket;
};

export const getMessages = async ({ ticketId, userId, rol }) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (ticket.userId !== userId && !ROLES_SOPORTE.includes(rol)) {
    throw { statusCode: 403, message: 'No tiene permiso para ver la conversacion de este ticket' };
  }

  const messages = await prisma.chatMessage.findMany({
    where: { ticketId },
    include: {
      sender: { select: { id: true, nombre: true, apellido: true, rol: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.chatMessage.updateMany({
    where: { ticketId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  const sinLeer = await prisma.chatMessage.count({
    where: { ticketId, senderId: { not: userId }, isRead: false },
  });

  return {
    ticket: {
      id: ticket.id,
      numero: ticket.numero,
      estado: ticket.estado,
      titulo: ticket.titulo,
    },
    messages,
    sinLeer,
  };
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

const SELECT_TICKET_VALIDACION = {
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
};

const lanzarYaAtendido = (ticket) => {
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
};

const completarAtendido = async ({ ticket, cita, userId, req, via = 'QR' }) => {
  const ahora = new Date();

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
    detalles: `Ticket "${ticket.numero}" validado por ${via} -> ATENDIDO`,
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

export const verifyQr = async ({ payload, userId, req }) => {
  const data = verifyQrPayload(payload);

  const ticket = await prisma.ticket.findUnique({
    where: { id: data.t },
    include: SELECT_TICKET_VALIDACION,
  });

  if (!ticket) {
    throw { statusCode: 404, message: 'Ticket no encontrado. Verifique el código QR.' };
  }

  if (ticket.estado === 'ATENDIDO' && ticket.atendidoEn) {
    lanzarYaAtendido(ticket);
  }

  return completarAtendido({ ticket, cita: ticket.citaPersonal, userId, req, via: 'QR' });
};

export const validarPorCodigo = async ({ codigo, userId, req }) => {
  const numero = String(codigo || '').trim();
  if (!/^TKT-\d{4}-\d+$/i.test(numero)) {
    throw { statusCode: 400, message: 'El código de ticket no tiene un formato válido.' };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { numero },
    include: SELECT_TICKET_VALIDACION,
  });

  if (!ticket) {
    throw { statusCode: 404, message: 'Ticket no encontrado. Verifique el código.' };
  }

  if (ticket.estado === 'ATENDIDO' && ticket.atendidoEn) {
    lanzarYaAtendido(ticket);
  }

  return completarAtendido({ ticket, cita: ticket.citaPersonal, userId, req, via: 'CODIGO' });
};
