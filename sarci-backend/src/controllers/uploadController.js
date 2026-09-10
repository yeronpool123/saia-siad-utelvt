import prisma from '../config/db.js';
import { success, badRequest, notFound } from '../utils/response.js';

export const uploadCedula = async (req, res) => {
  if (!req.file) {
    return badRequest(res, 'No se adjunto ningun archivo. Formato permitido: JPG, PNG, WebP. Maximo 5 MB.');
  }

  const fotoUrl = `/uploads/cedulas/${req.file.filename}`;

  const ticketId = req.body.ticketId;

  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return notFound(res, 'Ticket no encontrado');
    }
    if (ticket.userId !== req.user.id && req.user.rol !== 'SOPORTE_TI' && req.user.rol !== 'SUPER_ADMIN') {
      return badRequest(res, 'No tiene permiso para actualizar este ticket');
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { fotoCedulaUrl: fotoUrl },
    });
  }

  return success(res, 200, 'Foto de cedula subida exitosamente', { url: fotoUrl, filename: req.file.filename });
};
