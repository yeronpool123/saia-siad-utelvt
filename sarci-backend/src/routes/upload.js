import { Router } from 'express';
import auth from '../middlewares/auth.js';
import upload, { uploadChat } from '../middlewares/upload.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();

router.use(auth);

router.post('/cedula', upload.single('foto'), uploadController.uploadCedula);

router.post('/chat', (req, res, next) => {
  uploadChat.single('file')(req, res, (err) => {
    if (err) {
      const esTamano = err.code === 'LIMIT_FILE_SIZE';
      return res.status(esTamano ? 413 : 400).json({
        success: false,
        status: esTamano ? 413 : 400,
        message: esTamano ? 'El archivo excede el limite de 5 MB' : (err.message || 'Error al subir el archivo'),
      });
    }
    next();
  });
}, uploadController.uploadChat);

export default router;
