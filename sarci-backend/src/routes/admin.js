import { Router } from 'express';
import auth, { checkRole } from '../middlewares/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(auth);
router.use(checkRole('SOPORTE_TI', 'SUPER_ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/tickets', adminController.getAllTickets);
router.get('/tickets/ingeniero/:ingenieroId', adminController.getTicketsByIngeniero);

export default router;
