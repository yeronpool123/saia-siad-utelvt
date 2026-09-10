import { PrismaClient, Rol, TipoSoporte, Prioridad, EstadoTicket } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/utils/auth.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Iniciando seed de datos...');

  const categorias = await Promise.all([
    prisma.categoriaTicket.upsert({ where: { nombre: 'Credenciales' }, update: {}, create: { nombre: 'Credenciales', descripcion: 'Reseteo de contraseñas SIAD, correo institucional y desbloqueo de cuentas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Hardware' }, update: {}, create: { nombre: 'Hardware', descripcion: 'Problemas con equipos, periféricos, impresoras y redes físicas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Software' }, update: {}, create: { nombre: 'Software', descripcion: 'Instalación, configuración y errores de aplicaciones y plataformas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Red e Internet' }, update: {}, create: { nombre: 'Red e Internet', descripcion: 'Problemas de conectividad WiFi, VPN, acceso a plataformas en línea' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'General' }, update: {}, create: { nombre: 'General', descripcion: 'Solicitudes que no encajan en las demás categorías' } }),
  ]);
  console.log(`${categorias.length} categorías creadas`);

  const adminUser = await prisma.usuario.upsert({ where: { email: 'admin@utelvt.edu.ec' }, update: {}, create: { email: 'admin@utelvt.edu.ec', passwordHash: await hashPassword('Admin123!'), nombre: 'Administrador', apellido: 'Sistema', rol: Rol.SUPER_ADMIN, activo: true, departamento: 'Tecnología de la Información' } });
  const soporteUser = await prisma.usuario.upsert({ where: { email: 'soporte@utelvt.edu.ec' }, update: {}, create: { email: 'soporte@utelvt.edu.ec', passwordHash: await hashPassword('Admin123!'), nombre: 'Carlos', apellido: 'Soporte TI', rol: Rol.SOPORTE_TI, activo: true, departamento: 'Tecnología de la Información' } });
  const docenteUser = await prisma.usuario.upsert({ where: { email: 'docente@utelvt.edu.ec' }, update: {}, create: { email: 'docente@utelvt.edu.ec', passwordHash: await hashPassword('Docente123!'), nombre: 'María', apellido: 'García', rol: Rol.DOCENTE, activo: true, departamento: 'Facultad de Ingeniería' } });
  const estudianteUser = await prisma.usuario.upsert({ where: { email: 'estudiante@utelvt.edu.ec' }, update: {}, create: { email: 'estudiante@utelvt.edu.ec', passwordHash: await hashPassword('Estudiante123!'), nombre: 'Juan', apellido: 'Pérez', rol: Rol.ESTUDIANTE, activo: true, departamento: 'Ingeniería en Sistemas' } });
  console.log('4 usuarios creados');

  const configs = [
    { clave: 'max_tickets_abiertos', valor: '5', descripcion: 'Máximo de tickets abiertos simultáneos por usuario' },
    { clave: 'sla_horas_primera_respuesta', valor: '4', descripcion: 'SLA: horas máximas para primera respuesta' },
    { clave: 'sla_horas_resolucion', valor: '48', descripcion: 'SLA: horas máximas para resolución de tickets de prioridad media' },
    { clave: 'auto_asignar_soporte', valor: 'true', descripcion: 'Asignar tickets automáticamente al soporte con menos carga' },
    { clave: 'notificar_email', valor: 'true', descripcion: 'Enviar notificaciones por correo electrónico' },
    { clave: 'dias_retencion_logs', valor: '365', descripcion: 'Días de retención de logs de auditoría' },
  ];
  for (const c of configs) await prisma.configuracionSistema.upsert({ where: { clave: c.clave }, update: {}, create: c });
  console.log(`${configs.length} parámetros de configuración`);

  const t1 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0001', titulo: 'No puedo acceder al SIAD', descripcion: 'Desde ayer intento ingresar al sistema SIAD y me muestra un error de credenciales.', tipo: TipoSoporte.RESETEO_SIAD, prioridad: Prioridad.ALTA, estado: EstadoTicket.EN_PROCESO, userId: estudianteUser.id, asignadoAId: soporteUser.id, categoriaId: categorias[0].id, respuestaEn: new Date(Date.now() - 2 * 60 * 60 * 1000) } });
  const t2 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0002', titulo: 'Solicitud de acceso a Microsoft Teams', descripcion: 'Necesito acceso a la plataforma Microsoft Teams para las clases virtuales.', tipo: TipoSoporte.ACCESO_PLATAFORMA, prioridad: Prioridad.MEDIA, estado: EstadoTicket.PENDIENTE, userId: docenteUser.id, categoriaId: categorias[2].id } });
  const t3 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0003', titulo: 'La impresora del laboratorio no funciona', descripcion: 'La impresora HP LaserJet del laboratorio B-204 no imprime.', tipo: TipoSoporte.PROBLEMA_EQUIPO, prioridad: Prioridad.BAJA, estado: EstadoTicket.RESUELTO, userId: estudianteUser.id, asignadoAId: soporteUser.id, categoriaId: categorias[1].id, resolucion: 'Se reinstaló el driver de la impresora.', resueltoEn: new Date(Date.now() - 24 * 60 * 60 * 1000), cerradoEn: new Date() } });
  console.log('3 tickets de ejemplo creados');

  await prisma.comentario.createMany({ data: [
    { contenido: 'Hola Juan, estoy revisando tu caso. Revisa tu bandeja de spam.', ticketId: t1.id, userId: soporteUser.id, interno: false },
    { contenido: 'El estudiante tiene un alias diferente en AD. Coordinar con infraestructura.', ticketId: t1.id, userId: soporteUser.id, interno: true },
    { contenido: 'Gracias, revisaré ahora mismo.', ticketId: t1.id, userId: estudianteUser.id, interno: false },
    { contenido: 'Cartucho vacío reemplazado. Funciona correctamente.', ticketId: t3.id, userId: soporteUser.id, interno: true },
  ]});
  console.log('4 comentarios creados');

  console.log('');
  console.log('Seed completado exitosamente');
  console.log('Usuarios de prueba:');
  console.log('  Admin:      admin@utelvt.edu.ec / Admin123!');
  console.log('  Soporte:    soporte@utelvt.edu.ec / Admin123!');
  console.log('  Docente:    docente@utelvt.edu.ec / Docente123!');
  console.log('  Estudiante: estudiante@utelvt.edu.ec / Estudiante123!');
}

main().catch((e) => { console.error('Error en seed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
