export const validateCreateTicket = (req, res, next) => {
  const { titulo, descripcion, tipo } = req.body;
  const errors = [];

  if (!titulo) errors.push('El campo "titulo" es obligatorio');
  else if (titulo.trim().length < 5) errors.push('El título debe tener al menos 5 caracteres');
  else if (titulo.trim().length > 200) errors.push('El título no puede exceder 200 caracteres');

  if (!descripcion) errors.push('El campo "descripcion" es obligatorio');
  else if (descripcion.trim().length < 10) errors.push('La descripción debe tener al menos 10 caracteres');

  const tiposValidos = ['RESETEO_SIAD', 'RESETEO_CORREO', 'DESBLOQUEO_CUENTA', 'ACCESO_PLATAFORMA', 'PROBLEMA_EQUIPO', 'SOLICITUD_SOFTWARE', 'CONFIGURACION_RED', 'OTRO'];
  if (!tipo) errors.push('El campo "tipo" es obligatorio');
  else if (!tiposValidos.includes(tipo)) errors.push(`Tipo de soporte inválido: "${tipo}"`);

  const prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
  if (req.body.prioridad && !prioridadesValidas.includes(req.body.prioridad)) {
    errors.push(`Prioridad inválida: "${req.body.prioridad}"`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos del ticket inválidos', errors });
  }

  next();
};

export const validateUpdateTicket = (req, res, next) => {
  const { titulo, descripcion } = req.body;
  const errors = [];

  if (titulo !== undefined) {
    if (titulo.trim().length < 5) errors.push('El título debe tener al menos 5 caracteres');
    if (titulo.trim().length > 200) errors.push('El título no puede exceder 200 caracteres');
  }

  if (descripcion !== undefined) {
    if (descripcion.trim().length < 10) errors.push('La descripción debe tener al menos 10 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos de actualización inválidos', errors });
  }

  next();
};

export const validateCambiarEstado = (req, res, next) => {
  const { estado } = req.body;
  const errors = [];

  const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA', 'RESUELTO', 'CERRADO', 'RECHAZADO'];
  if (!estado) errors.push('El campo "estado" es obligatorio');
  else if (!estadosValidos.includes(estado)) errors.push(`Estado inválido: "${estado}"`);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos inválidos', errors });
  }

  next();
};

export const validateCreateComment = (req, res, next) => {
  const { contenido } = req.body;
  const errors = [];

  if (!contenido) errors.push('El campo "contenido" es obligatorio');
  else if (contenido.trim().length < 1) errors.push('El comentario no puede estar vacío');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos del comentario inválidos', errors });
  }

  next();
};
