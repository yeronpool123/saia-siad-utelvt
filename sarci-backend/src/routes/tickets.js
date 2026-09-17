import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import auth, { checkRole } from '../middlewares/auth.js';
import { validateCreateTicket, validateUpdateTicket, validateCambiarEstado, validateCreateComment, validateCancelarUsuario } from '../validators/tickets.js';

const router = Router();

router.use(auth);

router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.get('/:id/messages', ticketController.getMessages);
router.post('/', validateCreateTicket, ticketController.createTicket);
router.post('/verify-qr', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), ticketController.verifyQr);
router.put('/:code/validar', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), ticketController.validarPorCodigo);
router.put('/:id', validateUpdateTicket, ticketController.updateTicket);
router.patch('/:id/estado', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), validateCambiarEstado, ticketController.changeStatus);
router.patch('/:id/cancel-user', validateCancelarUsuario, ticketController.cancelByUser);
router.delete('/:id', ticketController.deleteTicket);
router.post('/:id/comentarios', validateCreateComment, ticketController.addComment);

export default router;
