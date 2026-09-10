import prisma from '../config/db.js';
import { getClientIp, getUserAgent } from '../utils/helpers.js';

export const auditLog = async ({
  userId, accion, ticketId = null, detalles = null,
  req = null, datosPrevios = null, datosNuevos = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId, accion, ticketId, detalles,
        ipAddress: req ? getClientIp(req) : null,
        userAgent: req ? getUserAgent(req) : null,
        datosPrevios: datosPrevios ? JSON.stringify(datosPrevios) : null,
        datosNuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
      },
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] No se pudo registrar la acción:', err.message);
  }
};

export const auditMiddleware = (accion) => {
  return async (req, res, next) => {
    next();
    if (res.statusCode < 400 && req.user) {
      await auditLog({
        userId: req.user.id, accion,
        ticketId: req.params?.ticketId || null,
        detalles: `${req.method} ${req.originalUrl}`,
        req, datosNuevos: req.body || null,
      });
    }
  };
};

export default auditLog;
