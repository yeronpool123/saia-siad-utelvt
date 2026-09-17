import { Server } from 'socket.io';
import config from './app.js';
import { verifyToken } from '../utils/auth.js';
import prisma from '../config/db.js';

let io = null;

const ROLES_SOPORTE = ['SOPORTE_TI', 'SUPER_ADMIN'];

const salaTicket = (ticketId) => `ticket_${ticketId}`;

const puedeAccederATicket = (ticket, usuario) =>
  ticket.userId === usuario.id || ROLES_SOPORTE.includes(usuario.rol);

const verificarTicket = async (ticketId, usuario) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    const err = new Error('Ticket no encontrado');
    err.statusCode = 404;
    throw err;
  }
  if (!puedeAccederATicket(ticket, usuario)) {
    const err = new Error('Sin permiso para acceder a este ticket');
    err.statusCode = 403;
    throw err;
  }
  return ticket;
};

const SELECCION_SENDER = { id: true, nombre: true, apellido: true, rol: true, email: true };

const autenticarSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token no proporcionado'));

    const decoded = verifyToken(token);
    if (!decoded?.userId) return next(new Error('Token inválido o expirado'));

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nombre: true, apellido: true, rol: true, activo: true },
    });

    if (!usuario || !usuario.activo) return next(new Error('Usuario no autorizado'));

    socket.data.usuario = usuario;
    next();
  } catch (err) {
    next(new Error('Error al verificar la autenticación'));
  }
};

const registrarEventosChat = (socket) => {
  const usuario = socket.data.usuario;
  const ack = (cb) => (err, data) => {
    if (typeof cb === 'function') cb(err ? { message: err.message } : null, data);
  };

  socket.on('join_ticket_room', async (payload, cb) => {
    const respond = ack(cb);
    if (!payload?.ticketId) return respond(new Error('ticketId es requerido'));
    try {
      await verificarTicket(payload.ticketId, usuario);
      socket.join(salaTicket(payload.ticketId));
      respond(null, { ok: true, room: salaTicket(payload.ticketId) });
    } catch (err) {
      respond(err);
    }
  });

  socket.on('leave_ticket_room', (payload) => {
    if (payload?.ticketId) socket.leave(salaTicket(payload.ticketId));
  });

  socket.on('send_message', async (payload, cb) => {
    const respond = ack(cb);
    try {
      const text = String(payload?.message || '').trim();
      if (!payload?.ticketId) return respond(new Error('ticketId es requerido'));
      const tieneAdjuntos =
        Array.isArray(payload.attachments) && payload.attachments.length > 0;
      if (!text && !tieneAdjuntos) return respond(new Error('El mensaje no puede estar vacío'));

      const ticket = await verificarTicket(payload.ticketId, usuario);

      const nuevoMensaje = await prisma.chatMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: usuario.id,
          message: text,
          attachments:
            Array.isArray(payload.attachments) && payload.attachments.length
              ? payload.attachments
              : null,
        },
        include: { sender: { select: SELECCION_SENDER } },
      });

      socket.join(salaTicket(ticket.id));
      io.to(salaTicket(ticket.id)).emit('new_message', nuevoMensaje);
      respond(null, nuevoMensaje);
    } catch (err) {
      respond(err);
    }
  });

  socket.on('typing_status', (payload) => {
    if (!payload?.ticketId) return;
    socket.join(salaTicket(payload.ticketId));
    socket.to(salaTicket(payload.ticketId)).emit('typing_indicator', {
      ticketId: payload.ticketId,
      isTyping: Boolean(payload.isTyping),
      usuario: { id: usuario.id, nombre: usuario.nombre },
    });
  });

  socket.on('mark_read', async (payload, cb) => {
    const respond = ack(cb);
    try {
      if (!payload?.ticketId) return respond(new Error('ticketId es requerido'));
      await verificarTicket(payload.ticketId, usuario);
      await prisma.chatMessage.updateMany({
        where: { ticketId: payload.ticketId, senderId: { not: usuario.id }, isRead: false },
        data: { isRead: true },
      });
      io.to(salaTicket(payload.ticketId)).emit('messages_read', {
        ticketId: payload.ticketId,
        byUserId: usuario.id,
      });
      respond(null, { ok: true });
    } catch (err) {
      respond(err);
    }
  });
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    transports: ['websocket', 'polling'],
  });

  io.use(autenticarSocket);

  io.on('connection', (socket) => {
    if (config.isDev) {
      console.log(`[SOCKET] Cliente conectado -> ${socket.id} (${socket.data.usuario?.email})`);
    }
    registrarEventosChat(socket);
    socket.on('disconnect', () => {
      if (config.isDev) {
        console.log(`[SOCKET] Cliente desconectado -> ${socket.id}`);
      }
    });
  });

  return io;
};

export const emitTicketEvent = (channel, data) => {
  if (io) io.emit(channel, data);
};

export const emitToTicketRoom = (ticketId, channel, data) => {
  if (io) io.to(salaTicket(ticketId)).emit(channel, data);
};

export const getSocket = () => io;

export default { initSocket, emitTicketEvent, emitToTicketRoom, getSocket };