import prisma from '../config/db.js';
import { hashPassword } from '../utils/auth.js';
import { auditLog } from '../middlewares/audit.js';

export const getProfile = async (userId) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, nombre: true, apellido: true,
      cedula: true, rol: true, telefono: true, departamento: true,
      activo: true, ultimoLogin: true, metadata: true,
      createdAt: true, updatedAt: true,
      ticketsCreados: {
        select: { id: true, numero: true, titulo: true, estado: true, prioridad: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { ticketsCreados: true } },
    },
  });
  if (!usuario) throw { statusCode: 404, message: 'Usuario no encontrado' };
  return usuario;
};

export const listUsers = async ({ page = 1, limit = 10, rol, activo, buscar }) => {
  const where = {};

  if (rol) where.rol = rol;
  if (activo !== undefined) where.activo = activo === 'true';
  if (buscar) {
    where.OR = [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { apellido: { contains: buscar, mode: 'insensitive' } },
      { email: { contains: buscar, mode: 'insensitive' } },
      { cedula: { contains: buscar, mode: 'insensitive' } },
    ];
  }

  const [usuarios, totalItems] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: {
        id: true, email: true, nombre: true, apellido: true,
        cedula: true, rol: true, telefono: true, departamento: true,
        activo: true, ultimoLogin: true, createdAt: true,
        _count: { select: { ticketsCreados: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    items: usuarios,
    meta: {
      page: Number(page), limit: Number(limit),
      totalItems, totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getUserById = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true, email: true, nombre: true, apellido: true,
      cedula: true, rol: true, telefono: true, departamento: true,
      activo: true, ultimoLogin: true, metadata: true,
      createdAt: true, updatedAt: true,
      _count: { select: { ticketsCreados: true, ticketsAsignados: true } },
    },
  });
  if (!usuario) throw { statusCode: 404, message: 'Usuario no encontrado' };
  return usuario;
};

export const updateUser = async ({ id, data, req }) => {
  const previo = await prisma.usuario.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Usuario no encontrado' };

  const updateData = {};
  const allowedFields = ['nombre', 'apellido', 'cedula', 'telefono', 'departamento', 'metadata'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: updateData,
    select: {
      id: true, email: true, nombre: true, apellido: true,
      cedula: true, rol: true, telefono: true, departamento: true,
      activo: true, ultimoLogin: true, createdAt: true, updatedAt: true,
    },
  });

  await auditLog({ userId: req.user.id, accion: 'ACTUALIZAR_USUARIO', detalles: `Usuario actualizado: ${previo.email}`, req, datosPrevios: previo, datosNuevos: usuario });

  return usuario;
};

export const changeRole = async ({ userId, nuevoRol, req }) => {
  const previo = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!previo) throw { statusCode: 404, message: 'Usuario no encontrado' };

  const usuario = await prisma.usuario.update({
    where: { id: userId },
    data: { rol: nuevoRol },
    select: { id: true, email: true, nombre: true, apellido: true, rol: true },
  });

  await auditLog({ userId: req.user.id, accion: 'ACTUALIZAR_USUARIO', detalles: `Rol cambiado de "${previo.rol}" a "${nuevoRol}" para usuario ${previo.email}`, req, datosPrevios: { rol: previo.rol }, datosNuevos: { rol: nuevoRol } });

  return usuario;
};

export const toggleActive = async ({ userId, activo, req }) => {
  const previo = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!previo) throw { statusCode: 404, message: 'Usuario no encontrado' };

  const usuario = await prisma.usuario.update({
    where: { id: userId },
    data: { activo },
    select: { id: true, email: true, nombre: true, activo: true },
  });

  await auditLog({ userId: req.user.id, accion: 'ACTUALIZAR_USUARIO', detalles: `Cuenta ${activo ? 'activada' : 'desactivada'}: ${previo.email}`, req });

  return usuario;
};
