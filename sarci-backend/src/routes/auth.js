import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateLogin, validateRegister, validateForgotPassword, validateResetPassword } from '../validators/auth.js';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

export default router;
