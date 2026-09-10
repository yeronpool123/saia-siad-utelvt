import { Router } from 'express';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();

router.use(auth);

router.post('/cedula', upload.single('foto'), uploadController.uploadCedula);

export default router;
