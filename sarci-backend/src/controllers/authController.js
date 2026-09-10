import * as authService from '../services/authService.js';
import { success, created, badRequest, internalError } from '../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login({ ...req.body, req });
    success(res, 200, 'Inicio de sesión exitoso', result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register({ ...req.body, req });
    created(res, result, 'Usuario registrado exitosamente');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken({ refreshToken: req.body.refreshToken, req });
    success(res, 200, 'Token refrescado exitosamente', result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword({ ...req.body, req });
    success(res, 200, result.message, result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({ ...req.body, req });
    success(res, 200, result.message);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};
