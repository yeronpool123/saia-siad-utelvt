import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import auth, { checkRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), auditController.listAuditLogs);
router.get('/stats', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), auditController.getStats);

export default router;
