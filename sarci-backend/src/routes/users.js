import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import auth, { checkRole } from '../middlewares/auth.js';

const router = Router();

router.get('/me', auth, userController.getProfile);
router.get('/:id', auth, checkRole('SOPORTE_TI', 'SUPER_ADMIN'), userController.getUserById);
router.get('/', auth, checkRole('SOPORTE_TI', 'SUPER_ADMIN'), userController.listUsers);
router.put('/:id', auth, userController.updateUser);
router.patch('/:id/rol', auth, checkRole('SUPER_ADMIN'), userController.changeRole);
router.patch('/:id/estado', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), userController.toggleActive);

export default router;
