# ERROR: El Webhook de n8n no está recibiendo datos (Diagnóstico y Reparación)

### Contexto del Problema:
1. El frontend y la base de datos funcionan perfectamente. Al enviar un formulario, el ticket se crea con éxito en PostgreSQL y se muestra el código de seguimiento en la web.
2. El archivo `sarci-backend/.env` tiene configurada correctamente la variable:
   `N8N_WEBHOOK_URL="http://localhost:5678/webhook-test/saia-ticket"`
3. La instancia local de n8n está activa en el puerto 5678, con el flujo importado y en modo "Listen for test event".
4. **SÍNTOMA:** Al enviar el ticket, n8n no reacciona en absoluto (se queda esperando hasta el timeout). No llega ningún correo ni se altera la hoja de Google Sheets. El backend parece estar ignorando la llamada o fallando en silencio.

Por favor, realiza una auditoría completa del flujo de backend y repara el problema siguiendo estos pasos de diagnóstico técnico:

### 1. Verificar la carga de la Variable de Entorno
* Revisa `sarci-backend/src/config/app.js` y `sarci-backend/src/services/ticketService.js`.
* Añade un `console.log("[DEBUG WEBHOOK] URL detectada:", config.n8nWebhookUrl);` justo antes del condicional `if (config.n8nWebhookUrl)`. 
* Necesitamos asegurarnos de que el servicio realmente está leyendo el string de la URL y que no está llegando como `undefined` o vacío debido a un problema de orden de carga de `dotenv`.

### 2. Validar la resolución de `localhost` (IPv6 vs IPv4)
* En Node.js 18 y versiones superiores, `localhost` a veces resuelve automáticamente a la dirección IPv6 (`::1`), mientras que n8n local podría estar escuchando únicamente en la interfaz IPv4 (`127.0.0.1`). Esto causa que la petición muera instantáneamente por un error de conexión rechazada (`ECONNREFUSED`).
* Modifica la lógica de disparo para que, si falla con `localhost`, intente alternativamente con `http://127.0.0.1:5678/webhook-test/saia-ticket`.

### 3. Mejorar el manejo de errores (Quitar el silencio)
* Actualmente, el bloque `.catch((err) => console.error(...))` solo imprime `err.message`. 
* Cambia temporalmente ese catch para que imprima el objeto de error completo (`console.error("[WEBHOOK CRITICAL ERROR]:", err);`) para poder ver el código de error exacto (ej. si es un error de red, un timeout, o un problema de parseo).

### 4. Asegurar el flujo asíncrono
* Confirma que el `fetch` no esté quedando flotante de una manera que Node.js aborte la petición cuando el controlador principal responde al frontend con el status 201.

Por favor, inspecciona los archivos, aplica estas mejoras de diagnóstico/robustez y avísame qué encontraste o qué corrección aplicaste en `ticketService.js` para volver a probar.