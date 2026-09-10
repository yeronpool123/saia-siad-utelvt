# AUDITORÍA URGENTE: El formulario no conecta con el Backend ni con n8n (Fallo Silencioso)

### 🚨 Diagnóstico del Estado Actual:
1. **El Backend NO recibe la petición de Tickets:** Al revisar los logs de la terminal del backend (`npm run dev`), vemos que registra perfectamente el `POST /api/v1/auth/login` y las consultas Prisma asociadas. Sin embargo, al enviar un ticket desde el frontend, **no se imprime absolutamente ningún log de POST ni query de INSERT en los tickets**.
2. **n8n está en silencio absoluto:** La terminal de n8n corre limpia en el puerto 5678, pero nunca se entera de nada porque el estímulo HTTP jamás sale o se desvía.
3. **Pistas en los archivos de entorno:** El archivo `.env.example` del frontend contiene variables llamadas `VITE_N8N_WEBHOOK_SEND_CODE` y `VITE_N8N_WEBHOOK_SUBMIT`, lo que sugiere una posible confusión sobre si el webhook debe dispararse desde el cliente (Frontend) o desde el servidor (Backend `ticketService.js`).

Por favor, actúa como un Ingeniero de Software Senior, audita los archivos implicados y corrige el flujo siguiendo esta hoja de ruta estricta:

---

### Paso 1: Localizar dónde se genera el código de seguimiento
Si la terminal del backend no registra la creación del ticket, comprueba el componente del formulario de envío de tickets en el Frontend (ej. `FormularioTicket.tsx` o similar):
* ¿El código de seguimiento (`SAIA-XXXXXX`) se está generando puramente en el cliente como un "mock" o simulación visual al presionar el botón?
* Revisa a qué URL exacta está apuntando el `fetch` o `axios` del frontend al crear un ticket. Debe apuntar a `http://localhost:3000/api/v1/tickets` (o la ruta correspondiente de tu API).

### Paso 2: Unificar la estrategia del Webhook (Debe ser en el Backend)
La estrategia correcta y segura es que el Frontend guarde en el Backend, y sea el Backend (`ticketService.js`) el que dispare el webhook hacia n8n usando la variable `N8N_WEBHOOK_URL` del `.env` del backend.
* Revisa `sarci-backend/src/services/ticketService.js`.
* Asegúrate de que la lógica de envío de n8n no esté envuelta en un bloque `try/catch` que esté ignorando los errores por completo (silent catch).
* Si el `fetch` hacia n8n se dejó como un proceso *fire-and-forget* (disparar y olvidar sin `await`), cámbialo temporalmente a un flujo síncrono con `await` para que, si falla la conexión con n8n, la terminal del backend explote con el error real (ej. `ECONNREFUSED` o `TypeError: fetch failed`).

### Paso 3: Corregir la resolución de Red (localhost vs 127.0.0.1)
En entornos Node.js modernos, mutar de `localhost` a la IP explícita evita fallos silenciosos de IPv6:
* Si en `ticketService.js` la URL es mapeada desde `config.n8nWebhookUrl`, implementa un reemplazo dinámico de seguridad:
  ```javascript
  const targetUrl = config.n8nWebhookUrl.replace('localhost', '127.0.0.1');