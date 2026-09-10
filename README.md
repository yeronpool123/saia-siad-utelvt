<div align="center">

  # 🎓 SAIA-SIAD
  ### Sistema Automatizado de Atención e Incidencias Administrativas
  **Universidad Técnica Luis Vargas Torres de Esmeraldas (UTELVT)**

  [![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Status](https://img.shields.io/badge/Estado-En_Desarrollo_v2.0-emerald?style=for-the-badge)](#)

  ---

  <p align="center">
    Plataforma "Phygital" para la gestión inteligente de citas presenciales, control dinámico de aforos técnicos y resolución automatizada de incidencias en el Departamento de TICs de la UTELVT.
  </p>

</div>

---

## 📌 Visión General del Proyecto

**SAIA-SIAD** nace como una propuesta de innovación tecnológica orientada a erradicar las aglomeraciones físicas, reducir tiempos de espera y digitalizar por completo el flujo de atención para estudiantes, docentes y personal administrativo dentro de la **Universidad Técnica Luis Vargas Torres**.

El sistema combina una interfaz web responsiva con **validación presencial mediante Código QR**, **algoritmos de control de aforo por hora** y **sincronización en tiempo real** entre usuarios y especialistas técnicos.

---

## 🚀 Funcionalidades Principales

### 📱 Experiencia del Usuario (Frontend)
* ✍️ **Efecto Typewriter Dinámico**: Animación en la cabecera del portal que destaca la transformación digital universitaria.
* 📧 **Generación Autónoma de Correo Institucional**: Algoritmo que autocompleta e inmutablemente asigna el correo `@utelvt.edu.ec` en tiempo real basándose en los nombres ingresados.
* 📅 **Motor de Citas con Control de Aforo**:
  * Restricción automática de fines de semana y feriados.
  * Límites dinámicos por bloque horario (Capacidad estándar de 5 usuarios/hora; bloque especial de almuerzo a 2 usuarios/hora).
* 🎛️ **Asignación Transparente de Especialistas**: Asignación de hasta 5 tickets por hora por ingeniero técnico.
* 🎟️ **Exportación de Comprobantes JPG**: Generación de ticket digital con QR descargable directamente a la galería del dispositivo.

### 🛡️ Panel Administrativo
* 📷 **Escáner e Intérprete de Códigos QR**: Validación en vivo de comprobantes impresos o en pantalla, cambiando el estado a `ATENDIDO` en tiempo real.
* 📊 **Dashboard Métrico Interactivo**: Tarjetas KPI animadas con filtrado instantáneo según estado (`Pendientes`, `En Proceso`, `Atendidos`).
* 🔎 **Auditoría Completa de Metadatos**: Visibilidad completa de Cédula, Facultad, Carrera y Rol del usuario en la cola de soporte.

---

## 🏗️ Arquitectura del Sistema


sarci-sistema/
├── sarci-backend/           # Servidor API REST (Node.js + Prisma + PostgreSQL)
│   ├── prisma/              # Esquema de Base de Datos y Migraciones
│   └── src/                 # Rutas, Controladores y Middleware de Autenticación
└── src/                     # Aplicación SPA Frontend (React + Vite + TailwindCSS)
├── components/          # Componentes Reutilizables (Scanner QR, Typewriter, Modales)
├── pages/               # Vistas de Usuario y Panel de Control Admin
└── services/            # Clientes de Red e Integración WebSockets


## 🏛️ Estructura de Facultades Integradas (UTELVT)

El sistema mapea dinámicamente las facultades y ofertas académicas de la institución:

| Facultad | Siglas | Carreras Coberturadas |
| :--- | :--- | :--- |
| **Facultad de Ingenierías** | `FACI` | Mecánica, Eléctrica, Química, Tecnologías de la Información |
| **Facultad de Ciencias Agropecuarias** | `FACAE` | Agronomía, Forestal, Zootecnia |
| **Facultad de la Pedagogía** | `FACPED` | Pedagogía de las Ciencias Experimentales, Lengua y Literatura, Ed. Básica, Ed. Inicial |
| **Facultad de Ciencias Sociales y Servicios** | `FACSOS` | Sociología, Trabajo Social, Hotelería y Turismo |

---

## 🛠️ Instalación y Despliegue Local

### Requisitos Previos
* Node.js v18+ 
* PostgreSQL v14+

### Pasos para Ejecución

1. **Clonar el Repositorio**:
   ```bash
   git clone [https://github.com/TU_USUARIO/saia-siad-utelvt.git](https://github.com/TU_USUARIO/saia-siad-utelvt.git)
   cd saia-siad-utelvt

Configurar Servidor Backend:

cd sarci-backend
npm install
# Configurar variables de entorno en el archivo .env (DATABASE_URL, PORT=3000)
npx prisma migrate dev
npm run dev


Configurar Frontend:

# En la raíz del proyecto principal
npm install
npm run dev
