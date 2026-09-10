import { Server } from 'socket.io';
import config from './app.js';

let io = null;

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

  io.on('connection', (socket) => {
    if (config.isDev) {
      console.log(`[SOCKET] Cliente conectado -> ${socket.id}`);
    }
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

export const getSocket = () => io;

export default { initSocket, emitTicketEvent, getSocket };