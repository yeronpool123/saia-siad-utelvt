// ============================================================
// SAIA-SIAD — Árbol Data Institucional + Utilidades de Dominio
// (Requerimientos 3, 5, 6 y 10)
// ============================================================

export const FACULTADES = {
  FACI: {
    nombre: 'Facultad de Ingenierías',
    carreras: [
      'Ingeniería Mecánica',
      'Ingeniería Eléctrica',
      'Ingeniería Química',
      'Ingeniería en Tecnologías de la Información y Comunicación',
    ],
  },
  FACAE: {
    nombre: 'Facultad de Ciencias Agropecuarias',
    carreras: [
      'Ingeniería en Agronomía',
      'Ingeniería Forestal',
      'Ingeniería en Zootecnia',
    ],
  },
  FACPED: {
    nombre: 'Facultad de la Pedagogía',
    carreras: [
      'Pedagogía de las Ciencias Experimentales (Matemáticas, Física, Química y Biología)',
      'Pedagogía de la Lengua y la Literatura',
      'Educación Básica',
      'Educación Inicial',
    ],
  },
  FACSOS: {
    nombre: 'Facultad de Ciencias Sociales y de Servicios',
    carreras: [
      'Licenciatura en Sociología',
      'Licenciatura en Trabajo Social',
      'Licenciatura en Hotelería y Turismo',
    ],
  },
}

export const FACULTAD_LISTA = Object.entries(FACULTADES).map(([codigo, fac]) => ({
  codigo,
  ...fac,
}))

export const getCarrerasDeFacultad = (codigo) => {
  const facultad = FACULTADES[codigo]
  return facultad ? facultad.carreras : []
}

export const ROLES_UNIVERSITARIOS = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'OTRO', label: 'Otro' },
]

export const ROL_LABEL = {
  ESTUDIANTE: 'Estudiante',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  OTRO: 'Otro',
  SOPORTE_TI: 'Soporte TI',
  SUPER_ADMIN: 'Super Admin',
}

// ─── Req 10: Algoritmo de normalización del correo institucional ───
export function generateInstitutionalEmail(firstNames, lastNames) {
  const normalizeStr = (str = '') =>
    String(str)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z\s]/g, '')

  const namesArr = normalizeStr(firstNames).split(/\s+/).filter(Boolean)
  const surnamesArr = normalizeStr(lastNames).split(/\s+/).filter(Boolean)

  if (namesArr.length === 0 || surnamesArr.length === 0) return ''

  const firstName = namesArr[0]
  const firstSurname = surnamesArr[0]
  const secondSurname = surnamesArr.length > 1 ? surnamesArr[1] : ''

  const emailPrefix = secondSurname
    ? `${firstName}.${firstSurname}.${secondSurname}`
    : `${firstName}.${firstSurname}`

  return `${emailPrefix}@utelvt.edu.ec`
}

// ─── Validación de Cédula Ecuatoriana ───
export function isValidCedulaEC(cedula) {
  if (!cedula) return false
  const value = String(cedula).replace(/\s/g, '')
  if (!/^\d{10}$/.test(value)) return false

  const provincia = parseInt(value.substring(0, 2), 10)
  if (provincia < 1 || provincia > 24) return false
  if (value[2] > '6') return false

  const digitoVerificador = parseInt(value[9], 10)
  const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let d = parseInt(value[i], 10) * pesos[i]
    if (d >= 10) d -= 9
    suma += d
  }
  const resultado = (10 - (suma % 10)) % 10
  return resultado === digitoVerificador
}

// ─── Req 3/6: Matriz de Horarios y Aforo ───
export const HORARIO_OPERATIVO = {
  inicio: '08:00 AM',
  cierre: '04:30 PM',
}

export const BLOQUES_HORARIOS = [
  { id: '0800', hora: '08:00 AM - 09:00 AM', inicio: '08:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '0900', hora: '09:00 AM - 10:00 AM', inicio: '09:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '1000', hora: '10:00 AM - 11:00 AM', inicio: '10:00 AM', capacidad: 5, jornada: 'manana' },
  { id: '1100', hora: '11:00 AM - 12:00 PM', inicio: '11:00 AM', capacidad: 2, jornada: 'manana' },
  { id: '1400', hora: '02:00 PM - 03:00 PM', inicio: '02:00 PM', capacidad: 5, jornada: 'tarde' },
  { id: '1500', hora: '03:00 PM - 04:00 PM', inicio: '03:00 PM', capacidad: 5, jornada: 'tarde' },
  { id: '1600', hora: '04:00 PM - 04:30 PM', inicio: '04:00 PM', capacidad: 1, jornada: 'tarde' },
]

export const TOPE_INGENIERO_POR_HORA = 5

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
]

export const isFinDeSemana = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.getDay() === 0 || d.getDay() === 6
}

export const esFeriado = (dateStr) => FERIADOS.includes(dateStr)

export const esDiaLaborable = (dateStr) => !isFinDeSemana(dateStr) && !esFeriado(dateStr)

export const formatFechaLabel = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function getDiasLaborables(count = 10) {
  const today = new Date()
  const dates = []
  const current = new Date(today)
  while (dates.length < count) {
    const iso = current.toISOString().split('T')[0]
    if (esDiaLaborable(iso)) dates.push(iso)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export const socketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  return apiUrl ? apiUrl.replace(/\/api\/v1\/?$/, '') : ''
}