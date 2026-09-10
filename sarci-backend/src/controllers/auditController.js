import * as auditService from '../services/auditService.js';
import { success } from '../utils/response.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const result = await auditService.listAuditLogs(req.query);
    success(res, 200, 'Logs de auditoría listados', result.items, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const result = await auditService.getStats();
    success(res, 200, 'Estadísticas del sistema', result);
  } catch (err) {
    next(err);
  }
};
