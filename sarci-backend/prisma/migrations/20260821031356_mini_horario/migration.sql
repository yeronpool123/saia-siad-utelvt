-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'SOPORTE_TI', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA', 'RESUELTO', 'CERRADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoSoporte" AS ENUM ('RESETEO_SIAD', 'RESETEO_CORREO', 'DESBLOQUEO_CUENTA', 'ACCESO_PLATAFORMA', 'PROBLEMA_EQUIPO', 'SOLICITUD_SOFTWARE', 'CONFIGURACION_RED', 'OTRO');

-- CreateEnum
CREATE TYPE "CitaEstado" AS ENUM ('ASIGNADA', 'EN_ATENCION', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREAR_USUARIO', 'ACTUALIZAR_USUARIO', 'ELIMINAR_USUARIO', 'CAMBIAR_PASSWORD', 'CREAR_TICKET', 'ACTUALIZAR_TICKET', 'CAMBIAR_ESTADO_TICKET', 'ASIGNAR_TICKET', 'ESCALAR_TICKET', 'CERRAR_TICKET', 'RECHAZAR_TICKET', 'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT', 'TOKEN_REFRESH', 'CREAR_COMENTARIO', 'ELIMINAR_COMENTARIO', 'ACTUALIZAR_CONFIG', 'SOLICITAR_RESET_PASSWORD', 'COMPLETAR_RESET_PASSWORD', 'EXPORTAR_DATOS', 'ACCESO_NO_AUTORIZADO', 'CREAR_CITA', 'CANCELAR_CITA', 'COMPLETAR_CITA');

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "cedula" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "telefono" TEXT,
    "departamento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_ticket" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoSoporte" NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoTicket" NOT NULL DEFAULT 'PENDIENTE',
    "userId" TEXT NOT NULL,
    "asignadoAId" TEXT,
    "categoriaId" TEXT,
    "resolucion" TEXT,
    "resuelto_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "respuesta_en" TIMESTAMP(3),
    "cerrado_en" TIMESTAMP(3),
    "adjuntos" JSONB,
    "metadata" JSONB,
    "fotoCedulaUrl" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "accion" "AccionAuditoria" NOT NULL,
    "detalles" TEXT,
    "ip_address" TEXT,
    "userAgent" TEXT,
    "datos_previos" JSONB,
    "datos_nuevos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "ticketId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas_personales" (
    "id" TEXT NOT NULL,
    "ingenieroNombre" TEXT NOT NULL,
    "ingenieroId" TEXT NOT NULL,
    "fecha_asignada" TIMESTAMP(3) NOT NULL,
    "hora_asignada" TEXT NOT NULL,
    "estado" "CitaEstado" NOT NULL DEFAULT 'ASIGNADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "citas_personales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_ticket_nombre_key" ON "categorias_ticket"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_key" ON "tickets"("numero");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");

-- CreateIndex
CREATE INDEX "tickets_estado_idx" ON "tickets"("estado");

-- CreateIndex
CREATE INDEX "tickets_prioridad_idx" ON "tickets"("prioridad");

-- CreateIndex
CREATE INDEX "tickets_tipo_idx" ON "tickets"("tipo");

-- CreateIndex
CREATE INDEX "tickets_asignadoAId_idx" ON "tickets"("asignadoAId");

-- CreateIndex
CREATE INDEX "comentarios_ticketId_idx" ON "comentarios"("ticketId");

-- CreateIndex
CREATE INDEX "comentarios_userId_idx" ON "comentarios"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_ticketId_idx" ON "audit_logs"("ticketId");

-- CreateIndex
CREATE INDEX "audit_logs_accion_idx" ON "audit_logs"("accion");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "reset_tokens"("token");

-- CreateIndex
CREATE INDEX "reset_tokens_token_idx" ON "reset_tokens"("token");

-- CreateIndex
CREATE INDEX "reset_tokens_expira_en_idx" ON "reset_tokens"("expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "citas_personales_ticketId_key" ON "citas_personales"("ticketId");

-- CreateIndex
CREATE INDEX "citas_personales_ingenieroId_idx" ON "citas_personales"("ingenieroId");

-- CreateIndex
CREATE INDEX "citas_personales_estado_idx" ON "citas_personales"("estado");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_tokens" ADD CONSTRAINT "reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_personales" ADD CONSTRAINT "citas_personales_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
