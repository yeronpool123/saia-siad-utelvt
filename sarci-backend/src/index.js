import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

import config from './config/app.js';
import prisma from './config/db.js';
import { initSocket } from './config/socket.js';
import errorHandler from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import ticketRoutes from './routes/tickets.js';
import auditRoutes from './routes/audit.js';
import uploadRoutes from './routes/upload.js';
import citaRoutes from './routes/citas.js';
import adminRoutes from './routes/admin.js';

const app = express();
const server = http.createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(resolve(__dirname, '../uploads')));

if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

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
app.use(`${config.api.basePath}/upload`, uploadRoutes);
app.use(`${config.api.basePath}/citas`, citaRoutes);
app.use(`${config.api.basePath}/admin`, adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, status: 404, message: 'Endpoint no encontrado', hint: 'Consulte /api/health' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Conexión a PostgreSQL establecida');

    initSocket(server);

    server.listen(config.port, () => {
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
