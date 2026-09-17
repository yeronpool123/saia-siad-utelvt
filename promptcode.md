# PROMPT DE REFACTORIZACIÓN: AUTOMATIZACIÓN DE ASIGNACIÓN DE TURNOS, GENERACIÓN DE TICKET DESCARGABLE EN JPG Y VALIDACIÓN QR EN TIEMPO REAL

## 🎯 OBJETIVO GENERAL
Refactorizar el flujo de reservación de citas presenciales en la plataforma SAIA-SIAD. Se debe ELIMINAR la selección manual de ingenieros por parte del usuario. En su lugar, el sistema asignará automáticamente y de manera aleatoria/equitativa a uno de los ingenieros disponibles para la hora seleccionada, cumpliendo con las reglas de negocio existentes. Tras la confirmación, se generará un ticket comprobante descargable en formato `.jpg` con el diseño exacto requerido (incluyendo logo, datos, QR y código de turno) y se actualizará en tiempo real el estado al ser escaneado.

---

## 🛠️ REQUISITOS DETALLADOS POR MÓDULO

### 1. FRONTEND: ELIMINACIÓN DEL MODAL DE SELECCIÓN DE INGENIERO
- **Eliminar paso manual:** Elimina el modal `IngenierosModal.jsx` o la pantalla intermedia donde el usuario elegía a un ingeniero específico.
- **Nuevo Flujo:** 
  1. El usuario selecciona la Fecha y la Hora del bloque deseado.
  2. Al hacer clic en **"Seleccionar atención en persona"** / **"Confirmar Asignación y Cita"**, la solicitud se envía directamente al backend indicando solo la fecha, hora y motivo/ticket.
  3. No se le muestra al usuario la lista de ingenieros para elegir.

---

### 2. BACKEND: ASIGNACIÓN ALEATORIA Y EQUITATIVA DE INGENIERO (`citaController.js` / `citaService.js`)
Implementa la lógica de asignación automática al recibir la petición de creación de cita:

1. **Obtención de Ingenieros Activos:** Consulta todos los ingenieros habilitados en el sistema (`activo: true`, rol `SOPORTE_TI` o `SUPER_ADMIN`).
2. **Filtrado por Aforo / Límite de 5 por Hora:**
   - Para la fecha y bloque horario solicitado, cuenta cuántas citas tiene asignadas cada ingeniero.
   - **Regla Estricta (NO MODIFICAR):** Si un ingeniero ya alcanzó el límite máximo de **5 citas en esa hora**, queda **DESCARTADO** para esa hora.
3. **Selección Aleatoria / Equitativa:**
   - De los ingenieros que aún tengan cupo disponible (< 5 citas en ese bloque):
     - Prioriza a los que tengan menor número de citas asignadas en ese bloque horario.
     - Si hay varios con la misma cantidad de citas, selecciona uno **aleatoriamente (al azar)**.
   - Si TODOS los ingenieros alcanzaron las 5 citas en esa hora, la API debe responder con un error claro de capacidad: *"El bloque horario seleccionado está completamente lleno. Por favor elija otra hora."*
4. **Respuesta de la API:** Retorna los datos de la cita creada, incluyendo el `id` y `nombre` del ingeniero asignado automáticamente, el código del turno (ej. `A-012`), y los datos del usuario.

---

### 3. GENERACIÓN DEL TICKET DESCARGABLE EN FORMATO `.JPG`

#### A. Ubicación del Logo de la Universidad
- Guarda la imagen del logo en la siguiente ruta pública del frontend:
  `public/assets/logo-utelvt.png` (o `public/logo-utelvt.png`).
- En el código de generación del comprobante, referencia la imagen mediante `/assets/logo-utelvt.png` para asegurar que html2canvas / canvas la cargue correctamente.

#### B. Estructura y Diseño Visual del Comprobante (Referencia Exacta)
Genera el ticket con estilo visual tipo recibo/comprobante vertical (usando `html2canvas`, `html-to-image` o similiar para exportar a `.jpg`):

1. **Encabezado Superior:**
   - **Logo:** `UTELVT - Tu Universidad` (cargado desde la ruta indicada).
2. **Identificador Principal:**
   - Título: **`TICKET`**
   - Código de Turno gigante y destacado: Ej. **`A-012`**
3. **Detalles del Servicio y Asignación:**
   - Motivo / Tipo de trámite (ej. *"Reseteo SIAD"* / Categoria del Ticket).
   - **Ingeniero Asignado:** *"Atendido por: Ing. [Nombre del Ingeniero]"*
   - **Datos del Usuario:** Nombre y Apellido del solicitante.
   - **Fecha y Hora:** Fecha y rango de hora asignado (ej. *2026-09-14 | 09:00 AM - 10:00 AM*).
4. **Código QR:**
   - Un código QR generado dinámicamente con la información encriptada/identificador único del turno/cita para su posterior validación.
5. **Pie del Ticket:**
   - Texto centrado: *"¡Gracias por tu paciencia!"*

#### C. Descarga
- Proporciona un botón visible: **"Descargar Ticket (.JPG)"** que procese la vista del comprobante y dispare la descarga automática del archivo con el nombre `Ticket-[CODIGO_TURNO].jpg`.

---

### 4. MÓDULO DE VALIDACIÓN DE CÓDIGO QR Y CAMBIO DE ESTADO EN TIEMPO REAL

1. **Escaneo del QR:**
   - Cuando el personal técnico escanee el QR desde el módulo **"Validar y Escanear QR"**:
   - El backend procesará la solicitud, validará el ID del ticket/cita y cambiará su estado en la base de datos a **`ATENDIDO`** / **`INVÁLIDO`**.
2. **Actualización Visual en Tiempo Real (Socket.io / Re-fetch):**
   - Inmediatamente al ser escaneado con éxito, emite un evento WebSocket o actualiza el estado.
   - **Interfaz del Sistema:** La vista donde se consulta o visualiza el ticket debe cambiar su diseño inmediatamente:
     - Mostrar un **aviso/badge destacado en LETRAS ROJAS BOLD**: 
       `❌ TICKET INVÁLIDO - YA FUE ATENDIDO EL [FECHA Y HORA DE ESCANEO]`
     - El ticket debe marcarse explícitamente como inhabilitado para evitar rehacer el escaneo o reutilizarlo.

---

## 📌 INSTRUCCIONES DE EJECUCIÓN
- Revisa las dependencias necesarias (`html2canvas`, `qrcode.react`, etc.) e instálalas si no están presentes.
- Ejecuta los cambios verificando sintaxis, imports y lógica en backend y frontend.
- Comprueba que el servidor inicie correctamente y que no rompa el flujo de creación de tickets virtuales ni las restricciones globales previamente establecidas.