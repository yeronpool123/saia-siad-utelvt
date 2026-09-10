import { internalError } from '../utils/response.js';
import config from '../config/app.js';

const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (config.isDev) {
    console.error('Stack:', err.stack);
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({
      success: false, status: 409,
      message: `Valor duplicado en el campo: ${field}`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false, status: 404,
      message: 'Registro no encontrado en la base de datos',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false, status: err.statusCode, message: err.message,
      ...(config.isDev && { details: err.details }),
    });
  }

  return internalError(
    res,
    config.isDev ? err.message : 'Error interno del servidor.'
  );
};

export default errorHandler;
