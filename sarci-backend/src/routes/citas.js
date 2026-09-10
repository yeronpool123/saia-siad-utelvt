import { Router } from 'express';
import auth from '../middlewares/auth.js';
import * as citaController from '../controllers/citaController.js';

const router = Router();

// Rutas públicas
router.get('/disponibilidad', citaController.getDisponibilidad);

// Rutas protegidas
router.use(auth);
router.get('/ingenieros', citaController.getIngenieros);
router.get('/horarios/:ingenieroId', citaController.getHorariosDisponibles);
router.post('/', citaController.crearCita);
router.patch('/:id/cancelar', citaController.cancelarCita);

export default router;
