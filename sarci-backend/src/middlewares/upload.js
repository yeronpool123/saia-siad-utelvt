import multer from 'multer';
import { resolve, dirname, extname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = resolve(__dirname, '../../uploads/cedulas');
const CHAT_DIR = resolve(__dirname, '../../uploads/chat');

mkdirSync(UPLOAD_DIR, { recursive: true });
mkdirSync(CHAT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const safeName = `cedula-${req.user.id}-${Date.now()}.${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes JPG, PNG o WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAT_DIR),
  filename: (req, file, cb) => {
    const ext = (extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.bin')).toLowerCase();
    const safeName = `chat-${req.user.id}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const chatFileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes (JPG, PNG, WebP) o PDF.'), false);
  }
};

export const uploadChat = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
