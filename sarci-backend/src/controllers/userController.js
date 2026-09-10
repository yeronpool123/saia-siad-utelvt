import * as userService from '../services/userService.js';
import { success, badRequest } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.id);
    success(res, 200, 'Perfil obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    success(res, 200, 'Usuarios listados', result.items, result.meta);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.params.id);
    success(res, 200, 'Usuario obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser({ id: req.params.id, data: req.body, req });
    success(res, 200, 'Usuario actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const changeRole = async (req, res, next) => {
  try {
    const result = await userService.changeRole({ userId: req.params.id, nuevoRol: req.body.rol, req });
    success(res, 200, 'Rol actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const toggleActive = async (req, res, next) => {
  try {
    const result = await userService.toggleActive({ userId: req.params.id, activo: req.body.activo, req });
    success(res, 200, `Cuenta ${req.body.activo ? 'activada' : 'desactivada'}`, result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};
