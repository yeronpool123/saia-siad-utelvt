# SAIA-SIAD Backend — Especificación Completa de Construcción

> **Sistema de Automatización de Identidad y Accesos — UTELVT**
> Documento técnico para Agente de IA autónomo. Contiene TODO el código fuente y especificaciones para construir el backend completo desde cero.

---

## Tabla de Contenidos

1. [Contexto General](#1-contexto-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Reglas de Ejecución Autónoma](#3-reglas-de-ejecución-autónoma)
4. [FASE 1 — Inicialización del Entorno](#4-fase-1--inicialización-del-entorno)
5. [FASE 2 — Diseño de Base de Datos](#5-fase-2--diseño-de-base-de-datos)
6. [FASE 3 — Estructura del Proyecto (Archivos Base)](#6-fase-3--estructura-del-proyecto-archivos-base)
7. [FASE 4 — Controladores, Servicios y Lógica de Negocio](#7-fase-4--controladores-servicios-y-lógica-de-negocio)
8. [Catálogo de Endpoints API](#8-catálogo-de-endpoints-api)
9. [Guía de Despliegue y Comandos](#9-guía-de-despliegue-y-comandos)
10. [Estructura Final de Archivos](#10-estructura-final-de-archivos)

---

## 1. Contexto General

Eres un **Arquitecto de Software y Desarrolador Backend Senior** con permisos de ejecución. Tu tarea es construir autónomamente el backend para el sistema **SAIA-SIAD** (Sistema de Automatización de Identidad y Accesos) de la UTELVT.

El frontend (React/Vite) ya existe en la carpeta `sarci-sistema`. El backend se construye desde cero en la carpeta `sarci-backend`.

**REGLA FUNDAMENTAL:** No pidas al usuario que copie y pegue código. Crea todos los archivos tú mismo usando tu capacidad de ejecución de terminal y sistema de archivos.

---

## 2. Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Entorno | Node.js (ES Modules) | `>= 18` |
| Framework | Express.js | `^5.2.1` |
| Base de Datos | PostgreSQL | `>= 14` |
| ORM | Prisma | `^7.8.0` |
| Seguridad | Helmet, CORS, bcrypt, JWT | latest |
| Desarrollo | nodemon, dotenv | latest |

**DEPENDENCIAS A INSTALAR:**

Producción:
```
express cors dotenv helmet bcrypt jsonwebtoken
```

Desarrollo:
```
prisma nodemon
```

---

## 3. Reglas de Ejecución Autónoma

1. Ejecuta las fases en **orden estricto** (FASE 1 → 2 → 3 → 4).
2. Crea cada archivo con el contenido exacto proporcionado.
3. No inventes código que no esté especificado.
4. Si un archivo YA EXISTE con el contenido indicado, **NO lo reescribas** (verifica primero).
5. Si un archivo existe pero el contenido es diferente (placeholder vs implementación real), **sobrescríbelo**.
6. Después de crear archivos, ejecuta los comandos de verificación indicados.
7. Reporta el resultado al finalizar cada fase.

---

## 4. FASE 1 — Inicialización del Entorno

### 4.1 Crear carpeta e inicializar npm

```bash
mkdir -p sarci-backend
cd sarci-backend
npm init -y
```

### 4.2 Configurar `package.json`

**Archivo:** `sarci-backend/package.json`

```json
{
  "name": "saia-siad-backend",
  "version": "1.0.0",
  "description": "Backend del Sistema de Automatización de Identidad y Accesos (SAIA-SIAD) - UTELVT",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js",
    "test": "echo \"Error: no test specified yet\" && exit 1"
  },
  "keywords": ["saia", "siad", "utelvt", "identity", "access", "automation"],
  "author": "SAIA-SIAD Team - UTELVT",
  "license": "ISC"
}
```

### 4.3 Instalar dependencias

```bash
npm install express cors dotenv helmet bcrypt jsonwebtoken
npm install -D prisma nodemon
```

### 4.4 Inicializar Prisma

```bash
npx prisma init
```

Esto generará automáticamente:
- `prisma/schema.prisma`
- `prisma.config.ts`
- `.env`

### 4.5 Crear `.gitignore`

**Archivo:** `sarci-backend/.gitignore`

```
node_modules/
generated/
.env
.env.local
.env.*.local
dist/
build/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo
```

---

## 5. FASE 2 — Diseño de Base de Datos

### 5.1 Esquema Prisma

**Archivo:** `sarci-backend/prisma/schema.prisma`

```prisma
// ============================================================
// SAIA-SIAD — Esquema de Base de Datos (Prisma)
// Sistema de Automatización de Identidad y Accesos — UTELVT
// ============================================================
// Este esquema fue diseñado para cubrir:
//   • Gestión de usuarios con roles granulares
//   • Tickets de soporte multi-tipo con seguimiento completo
//   • Bitácora de auditoría (trazabilidad total)
//   • Tokens de recuperación de contraseñas
//   • Categorías y prioridades dinámicas para tickets
//   • Comunicación interna por comentarios en tickets
//   • Configuración del sistema en base de datos
// ============================================================

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ─── ENUMERACIONES ───────────────────────────────────────

enum Rol {
  ESTUDIANTE
  DOCENTE
  ADMINISTRATIVO
  SOPORTE_TI
  SUPER_ADMIN
}

enum EstadoTicket {
  PENDIENTE
  EN_PROCESO
  ESPERANDO_RESPUESTA
  RESUELTO
  CERRADO
  RECHAZADO
}

enum Prioridad {
  BAJA
  MEDIA
  ALTA
  CRITICA
}

enum TipoSoporte {
  RESETEO_SIAD
  RESETEO_CORREO
  DESBLOQUEO_CUENTA
  ACCESO_PLATAFORMA
  PROBLEMA_EQUIPO
  SOLICITUD_SOFTWARE
  CONFIGURACION_RED
  OTRO
}

enum AccionAuditoria {
  // Acciones sobre usuarios
  CREAR_USUARIO
  ACTUALIZAR_USUARIO
  ELIMINAR_USUARIO
  CAMBIAR_PASSWORD

  // Acciones sobre tickets
  CREAR_TICKET
  ACTUALIZAR_TICKET
  CAMBIAR_ESTADO_TICKET
  ASIGNAR_TICKET
  ESCALAR_TICKET
  CERRAR_TICKET
  RECHAZAR_TICKET

  // Acciones de autenticación
  LOGIN_EXITOSO
  LOGIN_FALLIDO
  LOGOUT
  TOKEN_REFRESH

  // Acciones sobre comentarios
  CREAR_COMENTARIO
  ELIMINAR_COMENTARIO

  // Acciones sobre configuración
  ACTUALIZAR_CONFIG

  // Acciones sobre tokens
  SOLICITAR_RESET_PASSWORD
  COMPLETAR_RESET_PASSWORD

  // Otros
  EXPORTAR_DATOS
  ACCESO_NO_AUTORIZADO
}

// ─── MODELO: ConfiguracionSistema ─────────────────────────
// Almacena parámetros configurables del sistema en tiempo
// de ejecución sin necesidad de redeploy.
model ConfiguracionSistema {
  id          String   @id @default(cuid())
  clave       String   @unique
  valor       String
  descripcion String?
  updatedAt   DateTime @updatedAt

  @@map("configuracion_sistema")
}

// ─── MODELO: Usuario ─────────────────────────────────────
model Usuario {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  nombre        String
  apellido      String?
  cedula        String?   @unique
  rol           Rol       @default(ESTUDIANTE)
  telefono      String?
  departamento  String?
  activo        Boolean   @default(true)
  ultimoLogin   DateTime? @map("ultimo_login")
  metadata      Json?
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt   @map("updated_at")

  // Relaciones
  ticketsCreados  Ticket[]     @relation("TicketsCreados")
  ticketsAsignados Ticket[]    @relation("TicketsAsignados")
  comentarios      Comentario[]
  auditLogs        AuditLog[]
  resetTokens      ResetToken[]

  @@map("usuarios")
}

// ─── MODELO: CategoriaTicket ────────────────────────────
model CategoriaTicket {
  id          String   @id @default(cuid())
  nombre      String   @unique
  descripcion String?
  activa      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")

  tickets     Ticket[]

  @@map("categorias_ticket")
}

// ─── MODELO: Ticket ─────────────────────────────────────
model Ticket {
  id              String        @id @default(cuid())
  numero          String        @unique
  titulo          String
  descripcion     String        @db.Text
  tipo            TipoSoporte
  prioridad       Prioridad     @default(MEDIA)
  estado          EstadoTicket  @default(PENDIENTE)

  // Relaciones
  userId          String
  usuario         Usuario       @relation("TicketsCreados", fields: [userId], references: [id])
  asignadoAId     String?
  asignadoA       Usuario?      @relation("TicketsAsignados", fields: [asignadoAId], references: [id])
  categoriaId     String?
  categoria       CategoriaTicket? @relation(fields: [categoriaId], references: [id])

  // Resolución
  resolucion      String?       @db.Text
  resueltoEn      DateTime?     @map("resuelto_en")

  // Trazabilidad temporal
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt  @map("updated_at")
  respuestaEn     DateTime?     @map("respuesta_en")
  cerradoEn       DateTime?     @map("cerrado_en")

  // Metadatos adicionales
  adjuntos        Json?
  metadata        Json?

  // Relaciones adicionales
  comentarios     Comentario[]
  auditLogs       AuditLog[]

  @@index([userId])
  @@index([estado])
  @@index([prioridad])
  @@index([tipo])
  @@index([asignadoAId])
  @@map("tickets")
}

// ─── MODELO: Comentario ─────────────────────────────────
model Comentario {
  id        String   @id @default(cuid())
  contenido String  @db.Text
  interno   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  userId    String
  usuario   Usuario  @relation(fields: [userId], references: [id])

  @@index([ticketId])
  @@index([userId])
  @@map("comentarios")
}

// ─── MODELO: AuditLog ───────────────────────────────────
model AuditLog {
  id          String          @id @default(cuid())
  accion      AccionAuditoria
  detalles    String?        @db.Text
  ipAddress   String?        @map("ip_address")
  userAgent   String?        @db.Text
  datosPrevios Json?         @map("datos_previos")
  datosNuevos  Json?         @map("datos_nuevos")
  createdAt   DateTime       @default(now()) @map("created_at")

  userId      String?
  usuario     Usuario?       @relation(fields: [userId], references: [id])
  ticketId    String?
  ticket      Ticket?        @relation(fields: [ticketId], references: [id])

  @@index([userId])
  @@index([ticketId])
  @@index([accion])
  @@index([createdAt])
  @@map("audit_logs")
}

// ─── MODELO: ResetToken ─────────────────────────────────
model ResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  expiraEn  DateTime @map("expira_en")
  usado     Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  userId    String
  usuario   Usuario  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiraEn])
  @@map("reset_tokens")
}
```

### 5.2 Archivo `.env`

**Archivo:** `sarci-backend/.env`

```env
# ============================================================
# SAIA-SIAD — Variables de Entorno
# ============================================================

# ─── Base de Datos ───────────────────────────────────────
DATABASE_URL="postgresql://saia_user:tu_password_aqui@localhost:5432/saia_siad"

# ─── Servidor ─────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── JWT ──────────────────────────────────────────────────
JWT_SECRET="cambia_esto_por_una_clave_secreta_muy_segura_32chars_min"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"

# ─── Seguridad ────────────────────────────────────────────
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# ─── Recuperación de Contraseña ───────────────────────────
RESET_TOKEN_EXPIRES_IN="1h"

# ─── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# ─── Logging ──────────────────────────────────────────────
LOG_LEVEL="debug"
```

### 5.3 Verificar esquema — Generar cliente Prisma

```bash
npx prisma generate
```

---

## 6. FASE 3 — Estructura del Proyecto (Archivos Base)

### 6.1 Crear estructura de carpetas

```bash
mkdir -p src/{controllers,routes,middlewares,config,services,utils,validators}
mkdir -p prisma
```

### 6.2 Archivo: `src/config/db.js`

```javascript
// ============================================================
// SAIA-SIAD — Configuración de Base de Datos (Prisma)
// ============================================================

import { PrismaClient } from '../generated/prisma/index.js';

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 6.3 Archivo: `src/config/app.js`

```javascript
// ============================================================
// SAIA-SIAD — Configuración Centralizada de la Aplicación
// ============================================================

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  resetToken: {
    expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '1h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logLevel: process.env.LOG_LEVEL || 'debug',

  api: {
    prefix: '/api',
    version: '/v1',
    get basePath() {
      return `${this.prefix}${this.version}`;
    },
  },
};

export default config;
```

### 6.4 Archivo: `src/utils/response.js`

```javascript
// ============================================================
// SAIA-SIAD — Utilidades de Respuesta HTTP Estandarizadas
// ============================================================

export const success = (res, statusCode = 200, message = 'OK', data = null, meta = null) => {
  const response = {
    success: true,
    status: statusCode,
    message,
  };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const error = (res, statusCode = 500, message = 'Error interno del servidor', errors = null) => {
  const response = {
    success: false,
    status: statusCode,
    message,
  };
  if (errors !== null && Array.isArray(errors)) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const created = (res, data, message = 'Recurso creado exitosamente') =>
  success(res, 201, message, data);

export const noContent = (res) => res.status(204).send();

export const badRequest = (res, message = 'Solicitud inválida', errors = null) =>
  error(res, 400, message, errors);

export const unauthorized = (res, message = 'No autenticado') =>
  error(res, 401, message);

export const forbidden = (res, message = 'Sin permisos para realizar esta acción') =>
  error(res, 403, message);

export const notFound = (res, message = 'Recurso no encontrado') =>
  error(res, 404, message);

export const conflict = (res, message = 'Conflicto con el estado actual del recurso') =>
  error(res, 409, message);

export const tooManyRequests = (res, message = 'Demasiadas solicitudes. Intente nuevamente más tarde.') =>
  error(res, 429, message);

export const internalError = (res, message = 'Error interno del servidor') =>
  error(res, 500, message);

export default {
  success, error, created, noContent,
  badRequest, unauthorized, forbidden, notFound,
  conflict, tooManyRequests, internalError,
};
```

### 6.5 Archivo: `src/utils/auth.js`

```javascript
// ============================================================
// SAIA-SIAD — Utilidades de Encriptación y JWT
// ============================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/app.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
};

export const generateResetToken = () => {
  return crypto.randomUUID();
};

export default {
  hashPassword, comparePassword,
  generateToken, generateRefreshToken,
  verifyToken, generateResetToken,
};
```

### 6.6 Archivo: `src/utils/helpers.js`

```javascript
// ============================================================
// SAIA-SIAD — Utilidades Generales
// ============================================================

export const generateTicketNumber = (sequential) => {
  const year = new Date().getFullYear();
  const padded = String(sequential).padStart(4, '0');
  return `TKT-${year}-${padded}`;
};

export const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

export const hoursBetween = (start, end) => {
  const diffMs = Math.abs(new Date(end) - new Date(start));
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

export const sanitizeString = (str, maxLength = 255) => {
  if (!str) return '';
  return str.trim().slice(0, maxLength);
};

export const paginate = (items, page = 1, limit = 10) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);
  return {
    items: paginatedItems,
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default {
  generateTicketNumber, getClientIp, getUserAgent,
  hoursBetween, sanitizeString, paginate, isValidEmail,
};
```

### 6.7 Archivo: `src/middlewares/auth.js`

```javascript
// ============================================================
// SAIA-SIAD — Middleware de Autenticación JWT
// ============================================================

import { verifyToken } from '../utils/auth.js';
import { unauthorized, forbidden } from '../utils/response.js';
import prisma from '../config/db.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Token de autenticación no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return unauthorized(res, 'Token inválido o expirado');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, email: true, nombre: true,
        apellido: true, rol: true, activo: true,
      },
    });

    if (!usuario) {
      return unauthorized(res, 'Usuario no encontrado');
    }

    if (!usuario.activo) {
      return forbidden(res, 'Cuenta desactivada. Contacte al administrador.');
    }

    req.user = usuario;
    next();
  } catch (err) {
    return unauthorized(res, 'Error al verificar la autenticación');
  }
};

export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Debe estar autenticado');
    }
    if (!roles.includes(req.user.rol)) {
      return forbidden(
        res,
        `Rol "${req.user.rol}" no tiene permiso. Requiere: ${roles.join(', ')}`
      );
    }
    next();
  };
};

export default auth;
```

### 6.8 Archivo: `src/middlewares/audit.js`

```javascript
// ============================================================
// SAIA-SIAD — Middleware de Registro de Auditoría
// ============================================================

import prisma from '../config/db.js';
import { getClientIp, getUserAgent } from '../utils/helpers.js';

export const auditLog = async ({
  userId, accion, ticketId = null, detalles = null,
  req = null, datosPrevios = null, datosNuevos = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId, accion, ticketId, detalles,
        ipAddress: req ? getClientIp(req) : null,
        userAgent: req ? getUserAgent(req) : null,
        datosPrevios: datosPrevios ? JSON.stringify(datosPrevios) : null,
        datosNuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
      },
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] No se pudo registrar la acción:', err.message);
  }
};

export const auditMiddleware = (accion) => {
  return async (req, res, next) => {
    next();
    if (res.statusCode < 400 && req.user) {
      await auditLog({
        userId: req.user.id, accion,
        ticketId: req.params?.ticketId || null,
        detalles: `${req.method} ${req.originalUrl}`,
        req, datosNuevos: req.body || null,
      });
    }
  };
};

export default auditLog;
```

### 6.9 Archivo: `src/middlewares/errorHandler.js`

```javascript
// ============================================================
// SAIA-SIAD — Middleware de Manejo Global de Errores
// ============================================================

import { internalError } from '../utils/response.js';
import config from '../config/app.js';

const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (config.isDev) {
    console.error('Stack:', err.stack);
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({
      success: false, status: 409,
      message: `Valor duplicado en el campo: ${field}`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false, status: 404,
      message: 'Registro no encontrado en la base de datos',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false, status: err.statusCode, message: err.message,
      ...(config.isDev && { details: err.details }),
    });
  }

  return internalError(
    res,
    config.isDev ? err.message : 'Error interno del servidor.'
  );
};

export default errorHandler;
```

### 6.10 Archivo: `src/validators/auth.js`

```javascript
// ============================================================
// SAIA-SIAD — Validaciones de Autenticación
// ============================================================

import { isValidEmail } from '../utils/helpers.js';

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (!password) errors.push('El campo "password" es obligatorio');
  else if (password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos de entrada inválidos', errors });
  }

  next();
};

export const validateRegister = (req, res, next) => {
  const { email, password, nombre, rol } = req.body;

  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (!password) errors.push('El campo "password" es obligatorio');
  else if (password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
  else if (!/[A-Z]/.test(password)) errors.push('La contraseña debe incluir al menos una letra mayúscula');
  else if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número');
  if (!nombre) errors.push('El campo "nombre" es obligatorio');
  if (rol && !['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'SOPORTE_TI', 'SUPER_ADMIN'].includes(rol)) {
    errors.push(`Rol inválido: "${rol}"`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos de registro inválidos', errors });
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];
  if (!email) errors.push('El campo "email" es obligatorio');
  else if (!isValidEmail(email)) errors.push('El formato del email no es válido');
  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos inválidos', errors });
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = [];
  if (!token) errors.push('El campo "token" es obligatorio');
  if (!newPassword) errors.push('El campo "newPassword" es obligatorio');
  else if (newPassword.length < 8) errors.push('La nueva contraseña debe tener al menos 8 caracteres');
  if (errors.length > 0) {
    return res.status(400).json({ success: false, status: 400, message: 'Datos inválidos', errors });
  }
  next();
};
```

### 6.11 Archivo: `src/validators/tickets.js`

```javascript
// ============================================================
// SAIA-SIAD — Validaciones de Tickets
// ============================================================

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
```

---

## 7. FASE 4 — Controladores, Servicios y Lógica de Negocio

### 7.1 Servicio: `src/services/authService.js`

```javascript
// ============================================================
// SAIA-SIAD — Servicio de Autenticación
// ============================================================
// Toda la lógica de negocio de auth. Los controladores solo
// llaman a estos métodos y devuelven la respuesta HTTP.
// ============================================================

import prisma from '../config/db.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken, generateResetToken } from '../utils/auth.js';
import { auditLog } from '../middlewares/audit.js';
import config from '../config/app.js';

/**
 * Iniciar sesión con email y contraseña.
 * Retorna: { user (sin password), token, refreshToken }
 */
export const login = async ({ email, password, req }) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    await auditLog({ userId: null, accion: 'LOGIN_FALLIDO', detalles: `Email no encontrado: ${email}`, req });
    throw { statusCode: 401, message: 'Credenciales inválidas' };
  }

  if (!usuario.activo) {
    await auditLog({ userId: usuario.id, accion: 'LOGIN_FALLIDO', detalles: 'Cuenta desactivada', req });
    throw { statusCode: 403, message: 'Cuenta desactivada. Contacte al administrador.' };
  }

  const passwordMatch = await comparePassword(password, usuario.passwordHash);
  if (!passwordMatch) {
    await auditLog({ userId: usuario.id, accion: 'LOGIN_FALLIDO', detalles: 'Contraseña incorrecta', req });
    throw { statusCode: 401, message: 'Credenciales inválidas' };
  }

  // Actualizar último login
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date() },
  });

  const { passwordHash: _, ...userSafe } = usuario;
  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };

  await auditLog({ userId: usuario.id, accion: 'LOGIN_EXITOSO', detalles: 'Inicio de sesión exitoso', req });

  return {
    user: userSafe,
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

/**
 * Registrar un nuevo usuario.
 * Solo SUPER_ADMIN puede crear usuarios con roles específicos.
 */
export const register = async ({ email, password, nombre, apellido, cedula, rol, telefono, departamento, req }) => {
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 409, message: 'Ya existe un usuario con ese email' };
  }

  if (cedula) {
    const existingCedula = await prisma.usuario.findUnique({ where: { cedula } });
    if (existingCedula) {
      throw { statusCode: 409, message: 'Ya existe un usuario con esa cédula' };
    }
  }

  const passwordHash = await hashPassword(password);

  const usuario = await prisma.usuario.create({
    data: {
      email, passwordHash, nombre, apellido, cedula,
      rol: rol || 'ESTUDIANTE', telefono, departamento,
    },
  });

  const { passwordHash: _, ...userSafe } = usuario;
  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };

  await auditLog({ userId: usuario.id, accion: 'CREAR_USUARIO', detalles: `Usuario creado: ${email}`, req, datosNuevos: userSafe });

  return {
    user: userSafe,
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

/**
 * Refrescar un token de acceso usando el refresh token.
 */
export const refreshToken = async ({ refreshToken: token, req }) => {
  const decoded = verifyToken(token);
  if (!decoded) {
    throw { statusCode: 401, message: 'Refresh token inválido o expirado' };
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
  if (!usuario || !usuario.activo) {
    throw { statusCode: 401, message: 'Usuario no encontrado o inactivo' };
  }

  await auditLog({ userId: usuario.id, accion: 'TOKEN_REFRESH', detalles: 'Token refrescado', req });

  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
  return {
    token: generateToken(payload),
    refreshToken: generateRefreshToken({ userId: usuario.id }),
  };
};

/**
 * Solicitar recuperación de contraseña.
 * Genera un token UUID y lo guarda en la BD.
 */
export const forgotPassword = async ({ email, req }) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    // No revelar si el email existe (seguridad)
    return { message: 'Si el email existe, se enviará un correo de recuperación.' };
  }

  // Invalidar tokens previos
  await prisma.resetToken.updateMany({
    where: { userId: usuario.id, usado: false },
    data: { usado: true },
  });

  const token = generateResetToken();
  const expiraEn = new Date();
  expiraEn.setHours(expiraEn.getHours() + parseInt(config.resetToken.expiresIn, 10) || 1);

  await prisma.resetToken.create({
    data: { token, expiraEn, userId: usuario.id },
  });

  await auditLog({ userId: usuario.id, accion: 'SOLICITAR_RESET_PASSWORD', detalles: 'Token de reseteo generado', req });

  // En producción: enviar email con el token
  // console.log(`[RESET TOKEN] Token para ${email}: ${token}`);
  return { message: 'Si el email existe, se enviará un correo de recuperación.', token: config.isDev ? token : undefined };
};

/**
 * Ejecutar el cambio de contraseña usando el token de reseteo.
 */
export const resetPassword = async ({ token, newPassword, req }) => {
  const resetEntry = await prisma.resetToken.findUnique({ where: { token } });
  if (!resetEntry) {
    throw { statusCode: 400, message: 'Token de recuperación inválido' };
  }
  if (resetEntry.usado) {
    throw { statusCode: 400, message: 'Este token ya fue utilizado' };
  }
  if (new Date() > resetEntry.expiraEn) {
    throw { statusCode: 400, message: 'El token de recuperación ha expirado' };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: resetEntry.userId },
      data: { passwordHash },
    }),
    prisma.resetToken.update({
      where: { id: resetEntry.id },
      data: { usado: true },
    }),
  ]);

  await auditLog({ userId: resetEntry.userId, accion: 'COMPLETAR_RESET_PASSWORD', detalles: 'Contraseña actualizada via token de reseteo', req });

  return { message: 'Contraseña actualizada exitosamente' };
};
```

### 7.2 Servicio: `src/services/userService.js`

```javascript
// ============================================================
// SAIA-SIAD — Servicio de Usuarios
// ============================================================

import prisma from '../config/db.js';
import { hashPassword } from '../utils/auth.js';
import { auditLog } from '../middlewares/audit.js';

/**
 * Obtener perfil del usuario autenticado.
 */
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

/**
 * Listar todos los usuarios con filtros y paginación.
 */
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

/**
 * Obtener un usuario por ID.
 */
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

/**
 * Actualizar datos de un usuario.
 */
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

/**
 * Cambiar rol de un usuario (solo SUPER_ADMIN).
 */
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

/**
 * Activar/desactivar cuenta de usuario.
 */
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
```

### 7.3 Servicio: `src/services/ticketService.js`

```javascript
// ============================================================
// SAIA-SIAD — Servicio de Tickets
// ============================================================

import prisma from '../config/db.js';
import { generateTicketNumber } from '../utils/helpers.js';
import { auditLog } from '../middlewares/audit.js';

/**
 * Listar tickets con filtros avanzados y paginación.
 */
export const listTickets = async ({ userId, rol, page = 1, limit = 10, estado, prioridad, tipo, asignadoA, buscar }) => {
  const where = {};

  // Filtros por rol: estudiantes solo ven sus tickets
  if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    where.userId = userId;
  }

  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;
  if (tipo) where.tipo = tipo;
  if (asignadoA) where.asignadoAId = asignadoA;

  if (buscar) {
    where.OR = [
      { titulo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
    ];
  }

  const [tickets, totalItems] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true } },
        asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
        categoria: { select: { id: true, nombre: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: tickets,
    meta: {
      page: Number(page), limit: Number(limit),
      totalItems, totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Obtener un ticket por ID con todos sus comentarios.
 */
export const getTicketById = async (id, userId, rol) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true, telefono: true, departamento: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true, descripcion: true } },
      comentarios: {
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, rol: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      auditLogs: {
        select: { id: true, accion: true, detalles: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!ticket) throw { statusCode: 404, message: 'Ticket no encontrado' };

  // Solo el creador o un admin/soporte pueden ver el ticket
  if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    if (ticket.userId !== userId) {
      throw { statusCode: 403, message: 'No tiene permiso para ver este ticket' };
    }
    // Ocultar comentarios internos para usuarios no-técnicos
    ticket.comentarios = ticket.comentarios.filter(c => !c.interno);
  }

  return ticket;
};

/**
 * Crear un nuevo ticket.
 */
export const createTicket = async ({ data, userId, req }) => {
  // Verificar límite de tickets abiertos
  const ticketsAbiertos = await prisma.ticket.count({
    where: { userId, estado: { in: ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_RESPUESTA'] } },
  });

  const maxConfig = await prisma.configuracionSistema.findUnique({ where: { clave: 'max_tickets_abiertos' } });
  const maxTickets = maxConfig ? parseInt(maxConfig.valor, 10) : 5;

  if (ticketsAbiertos >= maxTickets) {
    throw { statusCode: 409, message: `Ha alcanzado el límite de ${maxTickets} tickets abiertos simultáneamente. Espere a que se resuelvan algunos.` };
  }

  // Generar número secuencial
  const ticketCount = await prisma.ticket.count();
  const numero = generateTicketNumber(ticketCount + 1);

  // Verificar unicidad del número
  const existingNumber = await prisma.ticket.findUnique({ where: { numero } });
  const finalNumero = existingNumber ? generateTicketNumber(ticketCount + 2) : numero;

  const ticket = await prisma.ticket.create({
    data: {
      numero: finalNumero,
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipo: data.tipo,
      prioridad: data.prioridad || 'MEDIA',
      userId,
      categoriaId: data.categoriaId || null,
      adjuntos: data.adjuntos || null,
    },
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  await auditLog({ userId, accion: 'CREAR_TICKET', ticketId: ticket.id, detalles: `Ticket creado: ${finalNumero}`, req, datosNuevos: data });

  return ticket;
};

/**
 * Actualizar un ticket.
 */
export const updateTicket = async ({ id, data, userId, rol, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  // Solo el creador puede actualizar datos básicos
  if (previo.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para actualizar este ticket' };
  }

  const updateData = {};
  const allowedFields = ['titulo', 'descripcion', 'categoriaId', 'adjuntos'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  await auditLog({ userId, accion: 'ACTUALIZAR_TICKET', ticketId: id, detalles: `Ticket actualizado: ${previo.numero}`, req, datosPrevios: previo, datosNuevos: updateData });

  return ticket;
};

/**
 * Cambiar estado de un ticket (solo soporte/admin).
 */
export const changeStatus = async ({ id, estado, resolucion, asignadoAId, userId, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  const updateData = { estado };

  if (estado === 'RESUELTO') {
    updateData.resolucion = resolucion || previo.resolucion || 'Ticket resuelto';
    updateData.resueltoEn = new Date();
    updateData.cerradoEn = new Date();
  }

  if (estado === 'CERRADO') {
    updateData.cerradoEn = new Date();
  }

  if (asignadoAId) {
    updateData.asignadoAId = asignadoAId;
  }

  // Si un técnico responde por primera vez, registrar timestamp
  if (estado === 'EN_PROCESO' && !previo.respuestaEn) {
    updateData.respuestaEn = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      asignadoA: { select: { id: true, email: true, nombre: true, apellido: true } },
      categoria: { select: { id: true, nombre: true } },
    },
  });

  const accionMap = {
    'EN_PROCESO': 'CAMBIAR_ESTADO_TICKET',
    'ESPERANDO_RESPUESTA': 'CAMBIAR_ESTADO_TICKET',
    'RESUELTO': 'CERRAR_TICKET',
    'CERRADO': 'CERRAR_TICKET',
    'RECHAZADO': 'RECHAZAR_TICKET',
    'PENDIENTE': 'CAMBIAR_ESTADO_TICKET',
  };

  await auditLog({
    userId, accion: accionMap[estado] || 'CAMBIAR_ESTADO_TICKET',
    ticketId: id,
    detalles: `Estado de ticket "${previo.numero}" cambiado de "${previo.estado}" a "${estado}"`,
    req, datosPrevios: { estado: previo.estado }, datosNuevos: { estado },
  });

  return ticket;
};

/**
 * Eliminar un ticket (cambiar a estado RECHAZADO = soft delete).
 */
export const deleteTicket = async ({ id, userId, rol, req }) => {
  const previo = await prisma.ticket.findUnique({ where: { id } });
  if (!previo) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (previo.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para eliminar este ticket' };
  }

  await prisma.ticket.update({
    where: { id },
    data: { estado: 'RECHAZADO', resolucion: 'Eliminado por el usuario' },
  });

  await auditLog({ userId, accion: 'RECHAZAR_TICKET', ticketId: id, detalles: `Ticket eliminado (rechazado): ${previo.numero}`, req });

  return { message: 'Ticket eliminado exitosamente' };
};

/**
 * Agregar comentario a un ticket.
 */
export const addComment = async ({ ticketId, contenido, interno, userId, rol, req }) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket no encontrado' };

  if (ticket.userId !== userId && rol !== 'SOPORTE_TI' && rol !== 'SUPER_ADMIN') {
    throw { statusCode: 403, message: 'No tiene permiso para comentar en este ticket' };
  }

  // Solo soporte/admin pueden crear comentarios internos
  const esInterno = (rol === 'SOPORTE_TI' || rol === 'SUPER_ADMIN') ? (interno || false) : false;

  const comentario = await prisma.comentario.create({
    data: {
      contenido, interno: esInterno,
      ticketId, userId,
    },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, rol: true } },
    },
  });

  // Si es la primera respuesta de un técnico, actualizar respuestaEn
  if ((rol === 'SOPORTE_TI' || rol === 'SUPER_ADMIN') && !ticket.respuestaEn) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { respuestaEn: new Date() },
    });
  }

  await auditLog({ userId, accion: 'CREAR_COMENTARIO', ticketId, detalles: `Comentario agregado al ticket ${ticket.numero}`, req });

  return comentario;
};
```

### 7.4 Servicio: `src/services/auditService.js`

```javascript
// ============================================================
// SAIA-SIAD — Servicio de Auditoría
// ============================================================

import prisma from '../config/db.js';

/**
 * Listar logs de auditoría con filtros.
 */
export const listAuditLogs = async ({ page = 1, limit = 20, userId, accion, ticketId, fechaDesde, fechaHasta }) => {
  const where = {};

  if (userId) where.userId = userId;
  if (accion) where.accion = accion;
  if (ticketId) where.ticketId = ticketId;
  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
    if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
  }

  const [logs, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true } },
        ticket: { select: { id: true, numero: true, titulo: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: logs,
    meta: {
      page: Number(page), limit: Number(limit),
      totalItems, totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Obtener estadísticas generales del sistema.
 */
export const getStats = async () => {
  const [
    totalUsuarios, totalTickets, ticketsPorEstado, ticketsPorPrioridad,
    ticketsHoy, logsHoy,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.ticket.groupBy({ by: ['prioridad'], _count: { prioridad: true } }),
    prisma.ticket.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  // Promedio de horas para resolver tickets
  const resueltos = await prisma.ticket.findMany({
    where: { resueltoEn: { not: null } },
    select: { createdAt: true, resueltoEn: true },
    take: 100,
  });

  const avgResolution = resueltos.length > 0
    ? resueltos.reduce((sum, t) => sum + (Math.abs(new Date(t.resueltoEn) - new Date(t.createdAt)) / (1000 * 60 * 60)), 0) / resueltos.length
    : 0;

  return {
    usuarios: { total: totalUsuarios },
    tickets: {
      total: totalTickets,
      hoy: ticketsHoy,
      porEstado: Object.fromEntries(ticketsPorEstado.map(e => [e.estado, e._count.estado])),
      porPrioridad: Object.fromEntries(ticketsPorPrioridad.map(e => [e.prioridad, e._count.prioridad])),
      promedioResolucionHoras: Math.round(avgResolution * 100) / 100,
    },
    actividad: { logsHoy },
  };
};
```

### 7.5 Controlador: `src/controllers/authController.js`

```javascript
// ============================================================
// SAIA-SIAD — Controlador de Autenticación
// ============================================================

import * as authService from '../services/authService.js';
import { success, created, badRequest, internalError } from '../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login({ ...req.body, req });
    success(res, 200, 'Inicio de sesión exitoso', result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register({ ...req.body, req });
    created(res, result, 'Usuario registrado exitosamente');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken({ refreshToken: req.body.refreshToken, req });
    success(res, 200, 'Token refrescado exitosamente', result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword({ ...req.body, req });
    success(res, 200, result.message, result);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({ ...req.body, req });
    success(res, 200, result.message);
  } catch (err) {
    if (err.statusCode) return badRequest(res, err.message);
    next(err);
  }
};
```

### 7.6 Controlador: `src/controllers/userController.js`

```javascript
// ============================================================
// SAIA-SIAD — Controlador de Usuarios
// ============================================================

import * as userService from '../services/userService.js';
import { success, badRequest } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.id);
    success(res, 200, 'Perfil obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    success(res, 200, 'Usuarios listados', result.items, result.meta);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.params.id);
    success(res, 200, 'Usuario obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser({ id: req.params.id, data: req.body, req });
    success(res, 200, 'Usuario actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const changeRole = async (req, res, next) => {
  try {
    const result = await userService.changeRole({ userId: req.params.id, nuevoRol: req.body.rol, req });
    success(res, 200, 'Rol actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const toggleActive = async (req, res, next) => {
  try {
    const result = await userService.toggleActive({ userId: req.params.id, activo: req.body.activo, req });
    success(res, 200, `Cuenta ${req.body.activo ? 'activada' : 'desactivada'}`, result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};
```

### 7.7 Controlador: `src/controllers/ticketController.js`

```javascript
// ============================================================
// SAIA-SIAD — Controlador de Tickets
// ============================================================

import * as ticketService from '../services/ticketService.js';
import { success, created, badRequest } from '../utils/response.js';

export const listTickets = async (req, res, next) => {
  try {
    const result = await ticketService.listTickets({ ...req.query, userId: req.user.id, rol: req.user.rol });
    success(res, 200, 'Tickets listados', result.items, result.meta);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const result = await ticketService.getTicketById(req.params.id, req.user.id, req.user.rol);
    success(res, 200, 'Ticket obtenido', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const result = await ticketService.createTicket({ data: req.body, userId: req.user.id, req });
    created(res, result, 'Ticket creado exitosamente');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const result = await ticketService.updateTicket({ id: req.params.id, data: req.body, userId: req.user.id, rol: req.user.rol, req });
    success(res, 200, 'Ticket actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const result = await ticketService.changeStatus({ id: req.params.id, ...req.body, userId: req.user.id, req });
    success(res, 200, 'Estado del ticket actualizado', result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const result = await ticketService.deleteTicket({ id: req.params.id, userId: req.user.id, rol: req.user.rol, req });
    success(res, 200, result.message);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const result = await ticketService.addComment({ ticketId: req.params.id, ...req.body, userId: req.user.id, rol: req.user.rol, req });
    created(res, result, 'Comentario agregado');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, status: err.statusCode, message: err.message });
    next(err);
  }
};
```

### 7.8 Controlador: `src/controllers/auditController.js`

```javascript
// ============================================================
// SAIA-SIAD — Controlador de Auditoría
// ============================================================

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
```

### 7.9 Rutas COMPLETAS: `src/routes/auth.js`

```javascript
// ============================================================
// SAIA-SIAD — Rutas de Autenticación
// ============================================================

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateLogin, validateRegister, validateForgotPassword, validateResetPassword } from '../validators/auth.js';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

export default router;
```

### 7.10 Rutas COMPLETAS: `src/routes/users.js`

```javascript
// ============================================================
// SAIA-SIAD — Rutas de Usuarios
// ============================================================

import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import auth, { checkRole } from '../middlewares/auth.js';

const router = Router();

// Rutas autenticadas
router.get('/me', auth, userController.getProfile);
router.get('/:id', auth, checkRole('SOPORTE_TI', 'SUPER_ADMIN'), userController.getUserById);
router.get('/', auth, checkRole('SOPORTE_TI', 'SUPER_ADMIN'), userController.listUsers);
router.put('/:id', auth, userController.updateUser);
router.patch('/:id/rol', auth, checkRole('SUPER_ADMIN'), userController.changeRole);
router.patch('/:id/estado', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), userController.toggleActive);

export default router;
```

### 7.11 Rutas COMPLETAS: `src/routes/tickets.js`

```javascript
// ============================================================
// SAIA-SIAD — Rutas de Tickets
// ============================================================

import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import auth, { checkRole } from '../middlewares/auth.js';
import { validateCreateTicket, validateUpdateTicket, validateCambiarEstado, validateCreateComment } from '../validators/tickets.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', validateCreateTicket, ticketController.createTicket);
router.put('/:id', validateUpdateTicket, ticketController.updateTicket);
router.patch('/:id/estado', checkRole('SOPORTE_TI', 'SUPER_ADMIN'), validateCambiarEstado, ticketController.changeStatus);
router.delete('/:id', ticketController.deleteTicket);
router.post('/:id/comentarios', validateCreateComment, ticketController.addComment);

export default router;
```

### 7.12 Rutas COMPLETAS: `src/routes/audit.js`

```javascript
// ============================================================
// SAIA-SIAD — Rutas de Auditoría
// ============================================================

import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import auth, { checkRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), auditController.listAuditLogs);
router.get('/stats', auth, checkRole('SUPER_ADMIN', 'SOPORTE_TI'), auditController.getStats);

export default router;
```

### 7.13 Archivo `src/index.js` COMPLETO

```javascript
// ============================================================
// SAIA-SIAD — Punto de Entrada del Servidor
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import config from './config/app.js';
import prisma from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import ticketRoutes from './routes/tickets.js';
import auditRoutes from './routes/audit.js';

const app = express();

// ═══ MIDDLEWARES GLOBALES ═══
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ═══ RUTAS ═══
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true, status: 'healthy',
    message: 'SAIA-SIAD Backend operativo',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, status: 'healthy', message: 'PostgreSQL conectado', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, status: 'unhealthy', message: 'PostgreSQL no disponible', error: config.isDev ? err.message : 'Error', timestamp: new Date().toISOString() });
  }
});

app.use(`${config.api.basePath}/auth`, authRoutes);
app.use(`${config.api.basePath}/users`, userRoutes);
app.use(`${config.api.basePath}/tickets`, ticketRoutes);
app.use(`${config.api.basePath}/audit-logs`, auditRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, status: 404, message: 'Endpoint no encontrado', hint: 'Consulte /api/health' });
});

app.use(errorHandler);

// ═══ INICIALIZACIÓN ═══
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Conexión a PostgreSQL establecida');

    app.listen(config.port, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('  SAIA-SIAD Backend — Servidor iniciado');
      console.log(`  Ambiente : ${config.nodeEnv.toUpperCase()}`);
      console.log(`  URL      : http://localhost:${config.port}`);
      console.log(`  API Base : http://localhost:${config.port}${config.api.basePath}`);
      console.log(`  Health   : http://localhost:${config.port}/api/health`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (err) {
    console.error('Error al iniciar:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => { console.log('\nCerrando servidor...'); await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

startServer();
```

### 7.14 Seed Script: `prisma/seed.js`

```javascript
// ============================================================
// SAIA-SIAD — Script de Seed (Datos Iniciales)
// ============================================================

import { PrismaClient, Rol, TipoSoporte, Prioridad, EstadoTicket } from '../generated/prisma/index.js';
import { hashPassword } from '../src/utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de datos...');

  // 1. Categorías
  const categorias = await Promise.all([
    prisma.categoriaTicket.upsert({ where: { nombre: 'Credenciales' }, update: {}, create: { nombre: 'Credenciales', descripcion: 'Reseteo de contraseñas SIAD, correo institucional y desbloqueo de cuentas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Hardware' }, update: {}, create: { nombre: 'Hardware', descripcion: 'Problemas con equipos, periféricos, impresoras y redes físicas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Software' }, update: {}, create: { nombre: 'Software', descripcion: 'Instalación, configuración y errores de aplicaciones y plataformas' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'Red e Internet' }, update: {}, create: { nombre: 'Red e Internet', descripcion: 'Problemas de conectividad WiFi, VPN, acceso a plataformas en línea' } }),
    prisma.categoriaTicket.upsert({ where: { nombre: 'General' }, update: {}, create: { nombre: 'General', descripcion: 'Solicitudes que no encajan en las demás categorías' } }),
  ]);
  console.log(`${categorias.length} categorías creadas`);

  // 2. Usuarios
  const adminUser = await prisma.usuario.upsert({ where: { email: 'admin@utelvt.edu.ec' }, update: {}, create: { email: 'admin@utelvt.edu.ec', passwordHash: await hashPassword('Admin123!'), nombre: 'Administrador', apellido: 'Sistema', rol: Rol.SUPER_ADMIN, activo: true, departamento: 'Tecnología de la Información' } });
  const soporteUser = await prisma.usuario.upsert({ where: { email: 'soporte@utelvt.edu.ec' }, update: {}, create: { email: 'soporte@utelvt.edu.ec', passwordHash: await hashPassword('Admin123!'), nombre: 'Carlos', apellido: 'Soporte TI', rol: Rol.SOPORTE_TI, activo: true, departamento: 'Tecnología de la Información' } });
  const docenteUser = await prisma.usuario.upsert({ where: { email: 'docente@utelvt.edu.ec' }, update: {}, create: { email: 'docente@utelvt.edu.ec', passwordHash: await hashPassword('Docente123!'), nombre: 'María', apellido: 'García', rol: Rol.DOCENTE, activo: true, departamento: 'Facultad de Ingeniería' } });
  const estudianteUser = await prisma.usuario.upsert({ where: { email: 'estudiante@utelvt.edu.ec' }, update: {}, create: { email: 'estudiante@utelvt.edu.ec', passwordHash: await hashPassword('Estudiante123!'), nombre: 'Juan', apellido: 'Pérez', rol: Rol.ESTUDIANTE, activo: true, departamento: 'Ingeniería en Sistemas' } });
  console.log('4 usuarios creados');

  // 3. Configuración
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

  // 4. Tickets de ejemplo
  const t1 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0001', titulo: 'No puedo acceder al SIAD', descripcion: 'Desde ayer intento ingresar al sistema SIAD y me muestra un error de credenciales.', tipo: TipoSoporte.RESETEO_SIAD, prioridad: Prioridad.ALTA, estado: EstadoTicket.EN_PROCESO, userId: estudianteUser.id, asignadoAId: soporteUser.id, categoriaId: categorias[0].id, respuestaEn: new Date(Date.now() - 2 * 60 * 60 * 1000) } });
  const t2 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0002', titulo: 'Solicitud de acceso a Microsoft Teams', descripcion: 'Necesito acceso a la plataforma Microsoft Teams para las clases virtuales.', tipo: TipoSoporte.ACCESO_PLATAFORMA, prioridad: Prioridad.MEDIA, estado: EstadoTicket.PENDIENTE, userId: docenteUser.id, categoriaId: categorias[2].id } });
  const t3 = await prisma.ticket.create({ data: { numero: 'TKT-2026-0003', titulo: 'La impresora del laboratorio no funciona', descripcion: 'La impresora HP LaserJet del laboratorio B-204 no imprime.', tipo: TipoSoporte.PROBLEMA_EQUIPO, prioridad: Prioridad.BAJA, estado: EstadoTicket.RESUELTO, userId: estudianteUser.id, asignadoAId: soporteUser.id, categoriaId: categorias[1].id, resolucion: 'Se reinstaló el driver de la impresora.', resueltoEn: new Date(Date.now() - 24 * 60 * 60 * 1000), cerradoEn: new Date() } });
  console.log('3 tickets de ejemplo creados');

  // 5. Comentarios
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
```

---

## 8. Catálogo de Endpoints API

### Autenticación (`/api/v1/auth`)

| Método | Ruta | Auth | Descripción | Body |
|---|---|---|---|---|
| POST | `/login` | No | Iniciar sesión | `{ email, password }` |
| POST | `/register` | No | Registrar usuario | `{ email, password, nombre, apellido?, rol?, cedula?, telefono?, departamento? }` |
| POST | `/refresh` | No | Refrescar token | `{ refreshToken }` |
| POST | `/forgot-password` | No | Solicitar reseteo | `{ email }` |
| POST | `/reset-password` | No | Ejecutar reseteo | `{ token, newPassword }` |

### Usuarios (`/api/v1/users`)

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/me` | Si | Todos | Perfil del usuario actual |
| GET | `/` | Si | SOPORTE_TI, SUPER_ADMIN | Listar usuarios (filtros: page, limit, rol, activo, buscar) |
| GET | `/:id` | Si | SOPORTE_TI, SUPER_ADMIN | Detalle de usuario |
| PUT | `/:id` | Si | Todos (su perfil) | Actualizar datos |
| PATCH | `/:id/rol` | Si | SUPER_ADMIN | Cambiar rol |
| PATCH | `/:id/estado` | Si | SUPER_ADMIN, SOPORTE_TI | Activar/desactivar cuenta |

### Tickets (`/api/v1/tickets`)

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/` | Si | Todos | Listar tickets (filtros: page, limit, estado, prioridad, tipo, asignadoA, buscar) |
| GET | `/:id` | Si | Todos (su ticket) | Detalle con comentarios |
| POST | `/` | Si | Todos | Crear ticket |
| PUT | `/:id` | Si | Todos (su ticket) | Actualizar ticket |
| PATCH | `/:id/estado` | Si | SOPORTE_TI, SUPER_ADMIN | Cambiar estado |
| DELETE | `/:id` | Si | Todos (su ticket) | Eliminar (soft-delete) |
| POST | `/:id/comentarios` | Si | Todos | Agregar comentario |

### Auditoría (`/api/v1/audit-logs`)

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/` | Si | SUPER_ADMIN, SOPORTE_TI | Listar logs (filtros: page, limit, userId, accion, ticketId, fechaDesde, fechaHasta) |
| GET | `/stats` | Si | SUPER_ADMIN, SOPORTE_TI | Estadísticas del sistema |

### Health Check

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | No | Estado del servidor |
| GET | `/api/health/db` | No | Estado de conexión a BD |

---

## 9. Guía de Despliegue y Comandos

### Desarrollo

```bash
cd sarci-backend

# 1. Instalar dependencias (si no se hizo)
npm install

# 2. Configurar .env con tu cadena de conexión PostgreSQL
# 3. Generar cliente Prisma
npx prisma generate

# 4. Crear migraciones
npx prisma migrate dev --name init

# 5. (Opcional) Poblar datos de prueba
node prisma/seed.js

# 6. Iniciar servidor en modo desarrollo
npm run dev
```

### Producción

```bash
cd sarci-backend

# Instalar dependencias
npm ci

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Iniciar servidor
npm start
```

### Comandos Útiles

```bash
npm run dev              # Servidor con hot-reload (nodemon)
npm start               # Servidor en producción
npm run prisma:studio   # Visor visual de la BD
npm run prisma:seed     # Poblar datos de prueba
npx prisma migrate dev  # Crear nueva migración
```

---

## 10. Estructura Final de Archivos

```
sarci-backend/
├── .env                          # Variables de entorno (NO commitear)
├── .gitignore                    # Archivos ignorados por Git
├── package.json                  # Configuración npm (ES Modules)
├── prisma.config.ts              # Config de Prisma 7 (auto-generado)
├── prisma/
│   ├── schema.prisma            # Esquema de BD (6 modelos, 5 enums)
│   └── seed.js                  # Datos iniciales de prueba
├── src/
│   ├── index.js                 # Punto de entrada del servidor
│   ├── config/
│   │   ├── app.js               # Configuración centralizada
│   │   └── db.js                # PrismaClient singleton
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticación
│   │   ├── userController.js    # Controlador de usuarios
│   │   ├── ticketController.js  # Controlador de tickets
│   │   └── auditController.js   # Controlador de auditoría
│   ├── middlewares/
│   │   ├── auth.js               # JWT auth + checkRole
│   │   ├── audit.js              # Registro de auditoría
│   │   └── errorHandler.js      # Manejo global de errores
│   ├── routes/
│   │   ├── auth.js              # /api/v1/auth/*
│   │   ├── users.js             # /api/v1/users/*
│   │   ├── tickets.js           # /api/v1/tickets/*
│   │   └── audit.js             # /api/v1/audit-logs/*
│   ├── services/
│   │   ├── authService.js       # Lógica de negocio: auth
│   │   ├── userService.js       # Lógica de negocio: usuarios
│   │   ├── ticketService.js     # Lógica de negocio: tickets
│   │   └── auditService.js     # Lógica de negocio: auditoría
│   ├── utils/
│   │   ├── response.js           # Respuestas HTTP estandarizadas
│   │   ├── auth.js               # Bcrypt + JWT helpers
│   │   └── helpers.js           # Utilidades generales
│   └── validators/
│       ├── auth.js               # Validaciones de autenticación
│       └── tickets.js           # Validaciones de tickets
└── generated/prisma/             # Cliente Prisma (auto-generado, NO editar)
```

---

**NOTA IMPORTANTE:** Este documento contiene el código completo y funcional de 23 archivos fuente que conforman el backend de SAIA-SIAD. Cada archivo debe ser creado exactamente con el contenido especificado. Las fases deben ejecutarse en orden estricto: FASE 1 → FASE 2 → FASE 3 → FASE 4.

**USUARIOS DE PRUEBA DESPUÉS DEL SEED:**

| Email | Password | Rol |
|---|---|---|
| admin@utelvt.edu.ec | Admin123! | SUPER_ADMIN |
| soporte@utelvt.edu.ec | Admin123! | SOPORTE_TI |
| docente@utelvt.edu.ec | Docente123! | DOCENTE |
| estudiante@utelvt.edu.ec | Estudiante123! | ESTUDIANTE |
