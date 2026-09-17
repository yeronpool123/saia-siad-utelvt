import prisma from '../config/db.js';
import { INGENIEROS } from '../config/horarios.js';

const ROLES_SOPORTE = ['SOPORTE_TI', 'SUPER_ADMIN'];

const especialidadDeUsuario = (usuario) => {
  if (
    usuario.metadata &&
    typeof usuario.metadata === 'object' &&
    usuario.metadata.especialidad
  ) {
    return String(usuario.metadata.especialidad);
  }
  return usuario.cargo || usuario.departamento || 'Soporte Técnico';
};

const mapearIngeniero = (usuario) => ({
  id: usuario.id,
  nombre: [usuario.nombre, usuario.apellido].filter(Boolean).join(' '),
  especialidad: especialidadDeUsuario(usuario),
});

export const getIngenierosActivos = async () => {
  const usuarios = await prisma.usuario.findMany({
    where: {
      activo: true,
      rol: { in: ROLES_SOPORTE },
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      cargo: true,
      departamento: true,
      metadata: true,
    },
    orderBy: { nombre: 'asc' },
  });

  return usuarios.map(mapearIngeniero);
};

export const getRosterIngenieros = async () => {
  const activos = await getIngenierosActivos();
  return activos.length > 0 ? activos : INGENIEROS;
};

export const obtenerCitasDelBloquePorIngeniero = async ({ fecha, hora }) => {
  const inicioDia = new Date(`${fecha}T00:00:00`);
  const finDia = new Date(`${fecha}T23:59:59.999`);

  const citasDelBloque = await prisma.citaPersonal.findMany({
    where: {
      fechaAsignada: { gte: inicioDia, lte: finDia },
      horaAsignada: hora,
      estado: { in: ['ASIGNADA', 'EN_ATENCION'] },
    },
    select: { ingenieroId: true },
  });

  const conteo = {};
  citasDelBloque.forEach((cita) => {
    conteo[cita.ingenieroId] = (conteo[cita.ingenieroId] || 0) + 1;
  });

  return conteo;
};

export const autoAsignarIngeniero = async ({ fecha, hora, limitePorHora = 5 }) => {
  const roster = await getRosterIngenieros();
  if (!roster || roster.length === 0) return null;

  const conteoPorIngeniero = await obtenerCitasDelBloquePorIngeniero({ fecha, hora });

  const disponibles = roster
    .map((ingeniero) => ({
      ...ingeniero,
      citasEnBloque: conteoPorIngeniero[ingeniero.id] || 0,
    }))
    .filter((ingeniero) => ingeniero.citasEnBloque < limitePorHora);

  if (disponibles.length === 0) return null;

  const menorCarga = Math.min(...disponibles.map((i) => i.citasEnBloque));
  const candidatos = disponibles.filter((i) => i.citasEnBloque === menorCarga);

  const seleccionado = candidatos[Math.floor(Math.random() * candidatos.length)];
  return seleccionado;
};

export const resolverIngeniero = async (ingenieroId) => {
  if (!ingenieroId) return null;

  const coincidencia = (await getIngenierosActivos()).find(
    (i) => i.id === ingenieroId
  );
  if (coincidencia) return coincidencia;

  return INGENIEROS.find((i) => i.id === ingenieroId) || null;
};

export default {
  getIngenierosActivos,
  getRosterIngenieros,
  resolverIngeniero,
  obtenerCitasDelBloquePorIngeniero,
  autoAsignarIngeniero,
};