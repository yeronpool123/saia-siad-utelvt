¡Hola OpenCode! Actúa como un Arquitecto de Software Senior y Desarrollador Full-Stack Experto. Necesito que realicemos una reestructuración profunda (aproximadamente el 50% de la lógica actual) de nuestra aplicación web SAIA-SIAD, evolucionándola hacia una plataforma híbrida, multifuncional y de gestión de tickets de soporte técnico.

0. FASE DE INGESTA Y ANÁLISIS CERO (OBLIGATORIO)
Antes de escribir una sola línea de código, necesito que analices todo el proyecto actual. Empápate de la arquitectura, la base de datos (Prisma/PostgreSQL), el backend (Node/Express) y el frontend (React/Vue/Svelte). Si ya tienes todo el contexto en tu memoria, omite la lectura, pero debes tener clarísimo cómo funciona actualmente el envío del formulario hacia el Webhook de n8n.

1. NUEVO SISTEMA DE ROLES (ADMINISTRADOR VS. USUARIOS)
Actualmente tenemos usuarios (Estudiantes, Administrativos, Docentes). Vamos a integrar el ROL ADMINISTRADOR.
*   **Funcionalidad del Admin:** El administrador debe tener un Dashboard donde pueda gestionar, visualizar y dar atención a las solicitudes de los usuarios.
*   **Visualización Completa:** El Admin debe poder ver TODOS los campos del formulario que llenó el usuario. 
*   **CORRECCIÓN CRÍTICA (LA FOTO DE LA CÉDULA):** Actualmente, el usuario carga la foto de su cédula en el frontend, pero parece ser un evento puramente visual. La imagen se queda en el limbo (no sabemos si se guarda en el servidor, en la BDD, y definitivamente NO está llegando a Google Sheets vía n8n). 
    *   *Tu Tarea Aquí:* Arreglar este flujo. La imagen debe subirse correctamente (almacenamiento local o en la nube), guardar su URL/ruta en la base de datos vinculada a ese ticket, mostrarse en el panel del Administrador para que podamos auditarla, y enviar su ruta/URL en el JSON del Webhook hacia n8n. No omitas este detalle por ningún motivo.

2. RESTRICCIONES DE DISEÑO FRONTEND (RECICLAJE ESTRICTO)
*   Para el panel del Administrador y las nuevas vistas, ESTÁ PROHIBIDO inventar nuevos diseños, paletas de colores o tipografías. 
*   Debes RECICLAR y REPLICAR exactamente la línea gráfica actual (botones, modales, tipografías, logos, inputs de los formularios de inicio/login/registro). 
*   La experiencia de usuario (UX/UI) del Admin debe sentirse como una extensión natural de lo que ya está construido. Copia los componentes existentes y adáptalos.

3. RESTRICCIONES DE BACKEND (SINCRONIZACIÓN SEGURA)
*   Detalla explícitamente qué nuevos modelos, controladores y rutas vas a crear para el rol Administrador y para el nuevo sistema de citas (que explicaré abajo).
*   TODO lo que integres debe hacerse SIN DAÑAR ni romper el flujo actual de registro, login y envío de webhooks. Trabaja de forma modular.

4. NUEVA FUNCIONALIDAD ESTRELLA: "MODAL DE ATENCIÓN EN PERSONA Y MINI-HORARIO"
Vamos a implementar un sistema de toma de decisiones dinámico en el formulario de soporte del usuario.
*   **Trámites Simples:** Si el usuario tiene un problema básico (reseteo, pérdida de credenciales), llena el formulario normal y los datos se envían por correo/n8n.
*   **Trámites Complejos (Atención en Persona):** Para problemas con sistemas de la universidad (reconocimiento facial, marcaciones biométricas con huella/facial, puertas de acceso, problemas de dimensiones de fotos en el sistema, valores pendientes de pago, etc.), el usuario DEBE solicitar atención física.
*   **El Flujo UI/UX del Mini-Horario:**
    1.  Si el usuario elige "Atención en Persona", se despliega un MODAL dinámico, fluido e intuitivo.
    2.  Dentro del modal, se le presentará la disponibilidad del personal de TICS. NO es atención 24/7.
    3.  Aparecerán los perfiles de 3 personas específicas:
        *   **Ing. Hector Sacón**
        *   **Ing. Luis Montaño**
        *   **Ing. Yeron Pool Cuero**
    4.  Cada perfil debe estar maquetado con un espacio para una foto (deja la ruta lista apuntando a un archivo local `.jpg` para que yo ponga las fotos después), su nombre y un botón de selección.
    5.  El usuario elige por quién quiere ser atendido.
    6.  El sistema debe generar un **TICKET DIGITAL** (código, fecha y hora asignada de acuerdo a la disponibilidad real o franjas horarias que definamos) y asignarlo a ese trabajador de TICS. Esto asegura una repartición equitativa y democrática de los usuarios.

5. EL DASHBOARD DEL ADMINISTRADOR (NOTIFICACIONES Y WORKLOAD)
*   Del lado del Admin, debe existir un panel que muestre a los 3 ingenieros mencionados.
*   Cada perfil de ingeniero debe tener un **CONTADOR EN TIEMPO REAL** (o al recargar) que indique cuántos usuarios han solicitado ser atendidos por él (Ej: "3 usuarios en espera para Ing. Yeron Pool Cuero").
*   El admin debe poder hacer clic en esos contadores y ver el detalle completo de las solicitudes (incluyendo la famosa foto de la cédula y todos los datos del formulario).

6. RECAPITULACIÓN DEL FLUJO DEL USUARIO (PARA QUE NO HAYA DUDAS)
1. El usuario se registra / inicia sesión.
2. Ingresa a la sección de soporte.
3. Elige su problema.
4. Si es simple -> Llena formulario -> Se envía a n8n/Sheets (Flujo actual mantenido y mejorado con la foto).
5. Si es complejo/físico -> Elige "Atención Personal" -> Llena el formulario base -> Se abre el Modal de los 3 Ingenieros -> Selecciona a uno -> El sistema le genera un Ticket con Fecha/Hora -> Esta petición se guarda en la BDD del sistema para ser gestionada en el panel Admin.

INSTRUCCIONES FINALES PARA OPENCODE:
Antes de generar código, quiero que respondas a este mensaje confirmando que has entendido ABSOLUTAMENTE TODOS los requerimientos, especialmente:
1. La necesidad de arreglar la carga de la foto de la cédula.
2. El reciclaje estricto del frontend.
3. La lógica del modal de los 3 ingenieros con sus contadores.
4. Dentro de la página principal, la de bienvenida cuando uno abre la app por primera vez hay un ícono llamado "Portal seguro activo" y ese icono tiene una animación de pulse mal implementada, arreglala y hazla mas natural, puesto que en su defecto actual su opacidad al final de la animación es muy busca dando esa sensación de que desaperece muy rapido y luego vuelve  a aparecer muy bruscamente, que desaparezca y tenga esa animación de loop sin pérdida de fluidez.
   
Dime cómo planeas estructurar la base de datos para esto y cómo vas a abordar el desarrollo. ¿Estás en capacidades de cumplir con todo esto sin romper la app actual?