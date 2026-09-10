export const success = (res, statusCode = 200, message = 'OK', data = null, meta = null) => {
  const response = {
    success: true,
    status: statusCode,
    message,
  };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const error = (res, statusCode = 500, message = 'Error interno del servidor', errors = null) => {
  const response = {
    success: false,
    status: statusCode,
    message,
  };
  if (errors !== null && Array.isArray(errors)) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const created = (res, data, message = 'Recurso creado exitosamente') =>
  success(res, 201, message, data);

export const noContent = (res) => res.status(204).send();

export const badRequest = (res, message = 'Solicitud inválida', errors = null) =>
  error(res, 400, message, errors);

export const unauthorized = (res, message = 'No autenticado') =>
  error(res, 401, message);

export const forbidden = (res, message = 'Sin permisos para realizar esta acción') =>
  error(res, 403, message);

export const notFound = (res, message = 'Recurso no encontrado') =>
  error(res, 404, message);

export const conflict = (res, message = 'Conflicto con el estado actual del recurso') =>
  error(res, 409, message);

export const tooManyRequests = (res, message = 'Demasiadas solicitudes. Intente nuevamente más tarde.') =>
  error(res, 429, message);

export const internalError = (res, message = 'Error interno del servidor') =>
  error(res, 500, message);

export default {
  success, error, created, noContent,
  badRequest, unauthorized, forbidden, notFound,
  conflict, tooManyRequests, internalError,
};
