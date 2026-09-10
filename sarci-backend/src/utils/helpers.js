export const generateTicketNumber = (sequential) => {
  const year = new Date().getFullYear();
  const padded = String(sequential).padStart(4, '0');
  return `TKT-${year}-${padded}`;
};

export const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

export const hoursBetween = (start, end) => {
  const diffMs = Math.abs(new Date(end) - new Date(start));
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

export const sanitizeString = (str, maxLength = 255) => {
  if (!str) return '';
  return str.trim().slice(0, maxLength);
};

export const paginate = (items, page = 1, limit = 10) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);
  return {
    items: paginatedItems,
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCedulaEC = (cedula) => {
  if (!cedula) return false;
  const value = String(cedula).replace(/\s/g, '');
  if (!/^\d{10}$/.test(value)) return false;

  const provincia = parseInt(value.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  if (value[2] > '6') return false;

  const digitoVerificador = parseInt(value[9], 10);
  const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(value[i], 10) * pesos[i];
    if (d >= 10) d -= 9;
    suma += d;
  }
  const resultado = (10 - (suma % 10)) % 10;
  return resultado === digitoVerificador;
};

export const generateInstitutionalEmail = (firstNames, lastNames) => {
  const normalizeStr = (str = '') =>
    String(str)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z\s]/g, '');

  const namesArr = normalizeStr(firstNames).split(/\s+/).filter(Boolean);
  const surnamesArr = normalizeStr(lastNames).split(/\s+/).filter(Boolean);
  if (namesArr.length === 0 || surnamesArr.length === 0) return '';

  const firstName = namesArr[0];
  const firstSurname = surnamesArr[0];
  const secondSurname = surnamesArr.length > 1 ? surnamesArr[1] : '';

  const emailPrefix = secondSurname
    ? `${firstName}.${firstSurname}.${secondSurname}`
    : `${firstName}.${firstSurname}`;

  return `${emailPrefix}@utelvt.edu.ec`;
};

export default {
  generateTicketNumber, getClientIp, getUserAgent,
  hoursBetween, sanitizeString, paginate, isValidEmail,
  isValidCedulaEC, generateInstitutionalEmail,
};
