import { Router } from 'express';
import auth from '../middlewares/auth.js';
import * as citaController from '../controllers/citaController.js';

const router = Router();

router.use(auth);

router.get('/ingenieros', citaController.getIngenieros);
router.get('/disponibilidad', citaController.getDisponibilidad);
router.get('/horarios/:ingenieroId', citaController.getHorariosDisponibles);
router.post('/', citaController.crearCita);
router.patch('/:id/cancelar', citaController.cancelarCita);

export default router;
