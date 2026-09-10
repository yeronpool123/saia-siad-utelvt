import crypto from 'crypto';
import config from '../config/app.js';

const QR_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

const encode = (obj) => {
  const json = JSON.stringify(obj);
  return Buffer.from(json, 'utf8').toString('base64url');
};

const decode = (payload) => {
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json);
};

const sign = (payload) => {
  return crypto.createHmac('sha256', config.jwt.secret).update(payload).digest('hex');
};

export const generateQrPayload = ({ ticketId, numero, cedula }) => {
  const body = encode({
    t: ticketId,
    n: numero,
    c: cedula || '',
    exp: Date.now() + QR_TTL_MS,
    ts: Date.now(),
  });
  return `${body}.${sign(body)}`;
};

export const verifyQrPayload = (qr) => {
  if (!qr || typeof qr !== 'string') {
    throw { statusCode: 400, message: 'Payload QR inválido' };
  }

  const parts = qr.split('.');
  if (parts.length !== 2) {
    throw { statusCode: 400, message: 'Formato de QR inválido' };
  }

  const [body, signature] = parts;

  const expected = sign(body);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw { statusCode: 401, message: 'QR no autorizado o alterado' };
  }

  let data;
  try {
    data = decode(body);
  } catch {
    throw { statusCode: 400, message: 'No se pudo interpretar el contenido del QR' };
  }

  if (!data.t || typeof data.t !== 'string') {
    throw { statusCode: 400, message: 'El QR no contiene un ticket válido' };
  }

  if (data.exp && Date.now() > data.exp) {
    throw { statusCode: 410, message: 'El código QR ha expirado' };
  }

  return data;
};

export default { generateQrPayload, verifyQrPayload };