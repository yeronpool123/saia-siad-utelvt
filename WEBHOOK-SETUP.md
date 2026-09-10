# Integración de Webhook para automatización con n8n

El frontend y la base de datos ya están funcionando correctamente. Ahora necesito preparar el backend para enviar los datos de los nuevos requerimientos/tickets hacia un flujo de automatización (n8n), y generar el esquema base para importarlo.

Por favor, realiza estas 3 tareas paso a paso:

### 1. Lógica del Webhook en el Backend
* Localiza el controlador o servicio donde se crean los "Tickets" o "Requerimientos" (cuando un usuario envía el formulario de soporte).
* Inmediatamente después de guardar el ticket exitosamente en PostgreSQL usando Prisma, añade lógica (usando `fetch` nativo de Node o `axios`) para realizar una petición HTTP POST a la URL definida en las variables de entorno.
* El payload (body) de la petición debe ser un JSON con las siguientes claves exactas (extraídas del ticket recién creado):
  - `fecha`
  - `nombres`
  - `cedula`
  - `requerimiento` (o tipo de soporte)
  - `descripcion`
* **IMPORTANTE:** Esta petición POST debe ser **asíncrona y no bloqueante** (`fire and forget`). Envuelve la llamada al webhook en un bloque `try/catch` que, en caso de error, solo imprima un `console.error`. El frontend siempre debe recibir su status `201 Created` casi de inmediato si la base de datos guardó el registro, sin esperar a que el webhook termine de responder.

### 2. Variables de Entorno
* Agrega la variable `N8N_WEBHOOK_URL=""` en el archivo `.env` del backend.
* Documenta la existencia de esta nueva variable en el archivo `README.md` del proyecto.

### 3. Crear plantilla de flujo n8n
* Crea un archivo en la raíz del proyecto llamado `n8n-workflow-template.json`.
* Escribe dentro un JSON válido que represente un flujo básico de n8n con 3 nodos conectados secuencialmente:
  1. **Webhook:** Configurado para recibir peticiones por método POST.
  2. **Google Sheets:** Configurado con la operación "Append Row" (añadir fila).
  3. **Send Email:** Nodo genérico de envío de correos (o Gmail).
* No te preocupes por configurar credenciales reales ni mapear los datos dentro del JSON, solo requiero la estructura base (los nodos y sus conexiones) para poder importarlo en mi panel visual.