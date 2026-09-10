import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

import config from './sarci-backend/src/config/app.js';
import prisma from './sarci-backend/src/config/db.js';
import { initSocket } from './sarci-backend/src/config/socket.js';
import errorHandler from './sarci-backend/src/middlewares/errorHandler.js';

import authRoutes from './sarci-backend/src/routes/auth.js';
import userRoutes from './sarci-backend/src/routes/users.js';
import ticketRoutes from './sarci-backend/src/routes/tickets.js';
import auditRoutes from './sarci-backend/src/routes/audit.js';
import uploadRoutes from './sarci-backend/src/routes/upload.js';
import citaRoutes from './sarci-backend/src/routes/citas.js';
import adminRoutes from './sarci-backend/src/routes/admin.js';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(resolve(__dirname, 'sarci-backend/uploads')));

// Health Endpoints
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'SAIA-SIAD Backend y Frontend operativos',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'Base de datos conectada',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Base de datos no disponible',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/citas', citaRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error Handler for API
app.use('/api', errorHandler);

// Initialize Socket.io
initSocket(server);

// Connect DB
await prisma.$connect();

// Frontend: Vite dev server or static dist
if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SAIA-SIAD UTELVT - Sistema Completo Iniciado');
  console.log(`  URL      : http://0.0.0.0:${PORT}`);
  console.log(`  API Base : http://0.0.0.0:${PORT}/api/v1`);
  console.log(`  Health   : http://0.0.0.0:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════');
});
