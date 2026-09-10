// ============================================================
// SAIA-SIAD — Matriz Global de Horarios y Reglas de Dominio
// Temporales (Requerimiento 3 y 6)
// ============================================================

export const INGENIEROS = [
  { id: 'hector-sacon', nombre: 'Ing. Hector Sacon', especialidad: 'Soporte de Infraestructura' },
  { id: 'luis-montano', nombre: 'Ing. Luis Montano', especialidad: 'Soporte de Plataformas' },
  { id: 'yeron-pool', nombre: 'Ing. Yeron Pool Cuero', especialidad: 'Soporte Técnico Integral' },
];

// Horario operativo total
export const HORARIO_OPERATIVO = {
  inicio: '08:00 AM',
  cierre: '04:30 PM',
};

export const TOPE_INGENIERO_POR_HORA = 5;

// Bloque final de la jornada (16:00 - 16:30) con margen de 30 min
export const BLOQUE_FINAL = {
  id: '1600',
  label: '04:00 PM - 04:30 PM',
  inicio: '04:00 PM',
  capacidad: 1,
  jornada: 'tarde',
};

export const BLOQUES_HORARIOS = [
  { id: '0800', label: '08:00 AM - 09:00 AM', inicio: '08:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '0900', label: '09:00 AM - 10:00 AM', inicio: '09:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '1000', label: '10:00 AM - 11:00 AM', inicio: '10:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '1100', label: '11:00 AM - 12:00 PM', inicio: '11:00 AM', capacidad: 2, jornada: 'manana' },
  { id: '1400', label: '02:00 PM - 03:00 PM', inicio: '02:00 PM', capacidad: 5, jornada: 'tarde' },
  { id: '1500', label: '03:00 PM - 04:00 PM', inicio: '03:00 PM', capacidad: 5, jornada: 'tarde' },
  { id: '1600', label: '04:00 PM - 04:30 PM', inicio: '04:00 PM', capacidad: 1, jornada: 'tarde' },
];

export const RECESO_LABEL = '12:00 PM - 02:00 PM (RECESO / CERRADO)';

export const getBloqueByLabel = (label) => BLOQUES_HORARIOS.find((b) => b.label.toLowerCase() === String(label).toLowerCase()) || null;

export const getCapacidadBloque = (label) => {
  const bloque = getBloqueByLabel(label);
  return bloque ? bloque.capacidad : 0;
};

export const getCapacidadIngenieroParaBloque = (label) => {
  const bloque = getBloqueByLabel(label);
  return bloque ? Math.min(TOPE_INGENIERO_POR_HORA, bloque.capacidad) : 0;
};

// ─── Feriados Institucionales 2026 (Ecuador / UTELVT) ────
export const FERIADOS = [
  '2026-01-01',
  '2026-03-02',
  '2026-03-03',
  '2026-04-03',
  '2026-05-01',
  '2026-05-24',
  '2026-08-10',
  '2026-10-09',
  '2026-11-02',
  '2026-11-03',
  '2026-12-25',
];

export const isFinDeSemana = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`);
  const dia = d.getDay();
  return dia === 0 || dia === 6;
};

export const esFeriado = (fecha) => FERIADOS.includes(fecha);

export const esDiaLaborable = (fecha) => !isFinDeSemana(fecha) && !esFeriado(fecha);

// Días no laborables para el bloqueo del selector
export const isDiaNoLaborable = (fecha) => !esDiaLaborable(fecha);

export default BLOQUES_HORARIOS;