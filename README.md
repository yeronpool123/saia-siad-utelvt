# SAIA-SIAD

Sistema de Automatización de Identidad y Accesos — UTELVT.

## Stack

### Frontend
- React + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React

### Backend (`sarci-backend/`)
- Express + Prisma
- PostgreSQL
- JSON Web Tokens (JWT)

## Instalación

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd sarci-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Variables de entorno

### Frontend (`.env` en la raíz)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Backend (`sarci-backend/.env`)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/saia_siad_db"
PORT=3000
JWT_SECRET="tu-secreto-jwt"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
N8N_WEBHOOK_URL="https://tu-n8n.com/webhook/ejemplo"
```

| Variable | Descripción |
|----------|-------------|
| `N8N_WEBHOOK_URL` | URL del webhook de n8n para enviar tickets automáticamente. Se envía un POST con `{ fecha, nombres, cedula, requerimiento, descripcion }` al crear un ticket. |

## Estructura

```
src/
├── App.jsx
├── components/
│   ├── auth/           # Login, Register, WelcomePanel
│   ├── dashboard/      # Dashboard, RequestForm, HelpModal
│   └── animations/     # AnimatedPointer, PulseIcon, etc.
├── lib/
│   ├── api.js          # Cliente HTTP (fetch)
│   └── motion.js       # Configuración de Framer Motion
├── hooks/
├── config/
└── styles/

sarci-backend/
├── src/
│   ├── index.js         # Servidor Express
│   ├── config/          # app.js, db.js
│   ├── controllers/     # auth, ticket, user, audit
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # auth, audit, errorHandler
├── prisma/
│   └── schema.prisma    # Modelo de datos
```
