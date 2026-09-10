import * as ticketService from '../services/ticketService.js';
import { success, created, badRequest } from '../utils/response.js';

export const listTickets = async (req, res, next) => {
  try {
    const result = await ticketService.listTickets({ ...req.query, userId: req.user.id, rol: req.user.rol });
    success(res, 200, 'Tickets listados', result.items, result.meta);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const result = await ticketService.getTicketById(req.params.id, req.user.id, req.user.rol);
    success(res, 200, 'Ticket obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const result = await ticketService.createTicket({ data: req.body, userId: req.user.id, req });
    created(res, result, 'Ticket creado exitosamente');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const result = await ticketService.updateTicket({ id: req.params.id, data: req.body, userId: req.user.id, rol: req.user.rol, req });
    success(res, 200, 'Ticket actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const result = await ticketService.changeStatus({ id: req.params.id, ...req.body, userId: req.user.id, req });
    success(res, 200, 'Estado del ticket actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const result = await ticketService.deleteTicket({ id: req.params.id, userId: req.user.id, rol: req.user.rol, req });
    success(res, 200, result.message);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const result = await ticketService.addComment({ ticketId: req.params.id, ...req.body, userId: req.user.id, rol: req.user.rol, req });
    created(res, result, 'Comentario agregado');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const verifyQr = async (req, res, next) => {
  try {
    const result = await ticketService.verifyQr({ payload: req.body.payload, userId: req.user.id, req });
    success(res, 200, 'Ticket validado y marcado como ATENDIDO', result);
  } catch (err) {
    if (err.statusCode) {
      const body = { success: false, status: err.statusCode, message: err.message };
      if (err.code) body.code = err.code;
      if (err.data) body.data = err.data;
      return res.status(err.statusCode).json(body);
    }
    next(err);
  }
};
