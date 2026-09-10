import prisma from '../config/db.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken, generateResetToken } from '../utils/auth.js';
import { auditLog } from '../middlewares/audit.js';
import config from '../config/app.js';

export const login = async ({ email, password, req }) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    await auditLog({ userId: null, accion: 'LOGIN_FALLIDO', detalles: `Email no encontrado: ${email}`, req });
    throw { statusCode: 401, message: 'Credenciales inválidas' };
  }

  if (!usuario.activo) {
    await auditLog({ userId: usuario.id, accion: 'LOGIN_FALLIDO', detalles: 'Cuenta desactivada', req });
    throw { statusCode: 403, message: 'Cuenta desactivada. Contacte al administrador.' };
  }

  const passwordMatch = await comparePassword(password, usuario.passwordHash);
  if (!passwordMatch) {
    await auditLog({ userId: usuario.id, accion: 'LOGIN_FALLIDO', detalles: 'Contraseña incorrecta', req });
    throw { statusCode: 401, message: 'Credenciales inválidas' };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date() },
  });

  const { passwordHash: _, ...userSafe } = usuario;
  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };

  await auditLog({ userId: usuario.id, accion: 'LOGIN_EXITOSO', detalles: 'Inicio de sesión exitoso', req });

  return {
    user: userSafe,
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

export const register = async ({ email, password, nombre, apellido, cedula, rol, telefono, departamento, facultad, carrera, cargo, req }) => {
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 409, message: 'Ya existe un usuario con ese email' };
  }

  if (cedula) {
    const existingCedula = await prisma.usuario.findUnique({ where: { cedula } });
    if (existingCedula) {
      throw { statusCode: 409, message: 'Ya existe un usuario con esa cédula' };
    }
  }

  const passwordHash = await hashPassword(password);

  const usuario = await prisma.usuario.create({
    data: {
      email, passwordHash, nombre, apellido, cedula,
      rol: rol || 'ESTUDIANTE', telefono, departamento,
      facultad, carrera, cargo,
    },
  });

  const { passwordHash: _, ...userSafe } = usuario;
  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };

  await auditLog({ userId: usuario.id, accion: 'CREAR_USUARIO', detalles: `Usuario creado: ${email}`, req, datosNuevos: userSafe });

  return {
    user: userSafe,
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

export const refreshToken = async ({ refreshToken: token, req }) => {
  const decoded = verifyToken(token);
  if (!decoded) {
    throw { statusCode: 401, message: 'Refresh token inválido o expirado' };
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
  if (!usuario || !usuario.activo) {
    throw { statusCode: 401, message: 'Usuario no encontrado o inactivo' };
  }

  await auditLog({ userId: usuario.id, accion: 'TOKEN_REFRESH', detalles: 'Token refrescado', req });

  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
  return {
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

export const forgotPassword = async ({ email, req }) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return { message: 'Si el email existe, se enviará un correo de recuperación.' };
  }

  await prisma.resetToken.updateMany({
    where: { userId: usuario.id, usado: false },
    data: { usado: true },
  });

  const token = generateResetToken();
  const expiraEn = new Date();
  expiraEn.setHours(expiraEn.getHours() + parseInt(config.resetToken.expiresIn, 10) || 1);

  await prisma.resetToken.create({
    data: { token, expiraEn, userId: usuario.id },
  });

  await auditLog({ userId: usuario.id, accion: 'SOLICITAR_RESET_PASSWORD', detalles: 'Token de reseteo generado', req });

  return { message: 'Si el email existe, se enviará un correo de recuperación.', token: config.isDev ? token : undefined };
};

export const resetPassword = async ({ token, newPassword, req }) => {
  const resetEntry = await prisma.resetToken.findUnique({ where: { token } });
  if (!resetEntry) {
    throw { statusCode: 400, message: 'Token de recuperación inválido' };
  }
  if (resetEntry.usado) {
    throw { statusCode: 400, message: 'Este token ya fue utilizado' };
  }
  if (new Date() > resetEntry.expiraEn) {
    throw { statusCode: 400, message: 'El token de recuperación ha expirado' };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: resetEntry.userId },
      data: { passwordHash },
    }),
    prisma.resetToken.update({
      where: { id: resetEntry.id },
      data: { usado: true },
    }),
  ]);

  await auditLog({ userId: resetEntry.userId, accion: 'COMPLETAR_RESET_PASSWORD', detalles: 'Contraseña actualizada via token de reseteo', req });

  return { message: 'Contraseña actualizada exitosamente' };
};
