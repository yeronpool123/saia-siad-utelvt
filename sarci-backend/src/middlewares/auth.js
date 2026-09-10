import { verifyToken } from '../utils/auth.js';
import { unauthorized, forbidden } from '../utils/response.js';
import prisma from '../config/db.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Token de autenticación no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return unauthorized(res, 'Token inválido o expirado');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, email: true, nombre: true,
        apellido: true, rol: true, activo: true,
      },
    });

    if (!usuario) {
      return unauthorized(res, 'Usuario no encontrado');
    }

    if (!usuario.activo) {
      return forbidden(res, 'Cuenta desactivada. Contacte al administrador.');
    }

    req.user = usuario;
    next();
  } catch (err) {
    return unauthorized(res, 'Error al verificar la autenticación');
  }
};

export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Debe estar autenticado');
    }
    if (!roles.includes(req.user.rol)) {
      return forbidden(
        res,
        `Rol "${req.user.rol}" no tiene permiso. Requiere: ${roles.join(', ')}`
      );
    }
    next();
  };
};

export default auth;
