import { isValidEmail, isValidCedulaEC } from '../utils/helpers.js';

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (!password) errors.push('El campo "password" es obligatorio');
  else if (password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos de entrada inválidos', errors });
  }

  next();
};

export const validateRegister = (req, res, next) => {
  const { email, password, nombre, rol, cedula } = req.body;

  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (!password) errors.push('El campo "password" es obligatorio');
  else if (password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
  else if (!/[A-Z]/.test(password)) errors.push('La contraseña debe incluir al menos una letra mayúscula');
  else if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número');
  if (!nombre) errors.push('El campo "nombre" es obligatorio');
  if (rol && !['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'OTRO'].includes(rol)) {
    errors.push(`Rol inválido: "${rol}"`);
  }
  if (cedula && !isValidCedulaEC(cedula)) {
    errors.push('La cédula ingresada no es una cédula ecuatoriana válida');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos de registro inválidos', errors });
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos inválidos', errors });
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = [];
  if (!token) errors.push('El campo "token" es obligatorio');
  if (!newPassword) errors.push('El campo "newPassword" es obligatorio');
  else if (newPassword.length < 8) errors.push('La nueva contraseña debe tener al menos 8 caracteres');
  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos inválidos', errors });
  }
  next();
};
