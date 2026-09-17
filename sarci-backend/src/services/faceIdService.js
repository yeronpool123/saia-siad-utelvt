import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { decode as decodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';
import prisma from '../config/db.js';
import { generateToken, generateRefreshToken } from '../utils/auth.js';
import { auditLog } from '../middlewares/audit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = resolve(__dirname, '../../storage/face_models');
const REFS_DIR = resolve(__dirname, '../../storage/face_id');
const WASM_DIR = resolve(__dirname, '../../node_modules/@tensorflow/tfjs-backend-wasm/dist');

const DISTANCE_THRESHOLD = 0.55;
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

const REFERENCE_FILES = [
  { file: 'hector.jpg', email: 'soporte@utelvt.edu.ec' },
  { file: 'yeron.jpg', email: 'admin@utelvt.edu.ec' },
  { file: 'luis.jpg', email: 'soporte02@utelvt.edu.ec' },
];

let modelsReadyPromise = null;
const CACHE_ADMIN_DESCRIPTORS = new Map();

const activateWasmBackend = async () => {
  if (tf.getBackend() === 'wasm') return;
  try {
    setWasmPaths(`${WASM_DIR}/`);
    await tf.setBackend('wasm');
    console.log('[FACE ID] Backend WASM activado (inferencia acelerada).');
  } catch (err) {
    console.warn(`[FACE ID] Backend WASM no disponible, se usará CPU: ${err?.message}`);
    if (tf.getBackend() === null || tf.getBackend() === 'cpu') await tf.setBackend('cpu');
  }
};

const ensureModels = () => {
  if (!modelsReadyPromise) {
    modelsReadyPromise = (async () => {
      await activateWasmBackend();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(resolve(MODELS_DIR, 'tiny_face_detector_model')),
        faceapi.nets.faceLandmark68Net.loadFromDisk(resolve(MODELS_DIR, 'face_landmark_68_model')),
        faceapi.nets.faceRecognitionNet.loadFromDisk(resolve(MODELS_DIR, 'face_recognition_model')),
      ]);
    })().catch((err) => {
      modelsReadyPromise = null;
      throw err;
    });
  }
  return modelsReadyPromise;
};

const bytesToRgbTensor = (buf) => {
  let width;
  let height;
  let data;
  if (buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    ({ width, height, data } = decodeJpeg(buf, { useTArray: true }));
  } else if (buf.length > 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
    const png = PNG.sync.read(buf);
    width = png.width;
    height = png.height;
    data = png.data;
  } else {
    throw { statusCode: 400, message: 'Formato de imagen no soportado (solo JPEG/PNG)' };
  }

  const out = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    out[j] = data[i];
    out[j + 1] = data[i + 1];
    out[j + 2] = data[i + 2];
  }
  return tf.tensor3d(out, [height, width, 3]);
};

const descriptorOfPhoto = async (bytes) => {
  const tensor = bytesToRgbTensor(bytes);
  try {
    const detections = await faceapi.detectAllFaces(tensor, DETECTOR_OPTIONS).withFaceLandmarks().withFaceDescriptors();
    if (!detections.length) return null;
    const best = detections.reduce((a, b) => (b.detection.score > a.detection.score ? b : a));
    return best.descriptor;
  } finally {
    tensor.dispose();
  }
};

const parseBase64Image = (image) => {
  if (typeof image !== 'string' || !image.trim()) {
    throw { statusCode: 400, message: 'La imagen es requerida' };
  }
  const match = image.trim().match(/^data:image\/[a-z+]+;base64,([^]+)$/i);
  const base64 = match ? match[1] : image;
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length) {
    throw { statusCode: 400, message: 'Imagen vacía o inválida' };
  }
  return bytes;
};

export const preloadAdminDescriptors = async () => {
  await ensureModels();
  CACHE_ADMIN_DESCRIPTORS.clear();

  for (const { file, email } of REFERENCE_FILES) {
    const path = resolve(REFS_DIR, file);
    if (!existsSync(path)) {
      console.warn(`[FACE ID] Referencia faltante: ${file} (${email})`);
      continue;
    }
    const descriptor = await descriptorOfPhoto(readFileSync(path));
    if (!descriptor) {
      console.warn(`[FACE ID] Sin rostro detectable en la referencia ${file}`);
      continue;
    }
    CACHE_ADMIN_DESCRIPTORS.set(email, { file, email, descriptor });
  }

  const loaded = Array.from(CACHE_ADMIN_DESCRIPTORS.values()).map((r) => r.email).join(', ');
  console.log(
    `[FACE ID] Descriptores de administradores pre-cargados en memoria RAM. ` +
      `(${CACHE_ADMIN_DESCRIPTORS.size}/${REFERENCE_FILES.length}${loaded ? `: ${loaded}` : ''})`,
  );
  if (!CACHE_ADMIN_DESCRIPTORS.size) {
    console.warn('[FACE ID] Ninguna referencia configurada: agregue las fotos en storage/face_id y reinicie.');
  }
  return CACHE_ADMIN_DESCRIPTORS;
};

export const faceLogin = async ({ image, req }) => {
  const bytes = parseBase64Image(image);
  const captured = await descriptorOfPhoto(bytes);
  if (!captured) {
    throw { statusCode: 400, message: 'No se detectó un rostro en la imagen. Colóquese frente a la cámara con buena iluminación.' };
  }

  if (!CACHE_ADMIN_DESCRIPTORS.size) {
    throw { statusCode: 503, message: 'Face ID no configurado. Contacte al administrador.' };
  }

  let best = null;
  for (const ref of CACHE_ADMIN_DESCRIPTORS.values()) {
    const distance = faceapi.euclideanDistance(captured, ref.descriptor);
    if (distance <= DISTANCE_THRESHOLD && (!best || distance < best.distance)) {
      best = { ...ref, distance };
    }
  }

  if (!best) {
    await auditLog({ userId: null, accion: 'LOGIN_FALLIDO', detalles: 'Face ID: rostro no reconocido', req });
    throw { statusCode: 401, message: 'Rostro no reconocido. Intente nuevamente o use su contraseña.' };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: best.email } });
  if (!usuario || !usuario.activo) {
    throw { statusCode: 403, message: 'Cuenta desactivada. Contacte al administrador.' };
  }

  const similarity = Math.max(0, Math.min(1, 1 - (best.distance * best.distance) / 2));

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date() },
  });

  const { passwordHash: _, ...userSafe } = usuario;
  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };

  await auditLog({
    userId: usuario.id,
    accion: 'LOGIN_EXITOSO',
    detalles: `Inicio de sesión con Face ID (similitud ${(similarity * 100).toFixed(1)}%, distancia ${best.distance.toFixed(4)})`,
    req,
  });

  return {
    user: userSafe,
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
    faceId: {
      similarity: Number((similarity * 100).toFixed(1)),
      distance: Number(best.distance.toFixed(4)),
    },
  };
};