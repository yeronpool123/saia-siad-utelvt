import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import auth, { checkRole } from '../middlewares/auth.js';
import { validateCreateTicket, validateUpdateTicket, validateCambiarEstado, validateCreateComment } from '../validators/tickets.js';

const router = Router();

router.use(auth);

router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', validateCreateTicket, ticketController.createTicket);
router.post('/verify-qr', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), ticketController.verifyQr);
router.put('/:id', validateUpdateTicket, ticketController.updateTicket);
router.patch('/:id/estado', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), validateCambiarEstado, ticketController.changeStatus);
router.delete('/:id', ticketController.deleteTicket);
router.post('/:id/comentarios', validateCreateComment, ticketController.addComment);

export default router;
