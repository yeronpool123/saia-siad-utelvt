import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Trash2, Send } from 'lucide-react'
import { EASE_OUT } from '../../lib/motion'

const SYSTEM_PROMPT = `Eres el "Asistente Virtual SAIA-SIAD", el chatbot de soporte de la Universidad Tecnica Luis Vargas Torres de Esmeraldas (UTELVT). Respondes de forma profesional, clara, empatica y en espanol. Usa formato Markdown simple (negritas con ** **, listas con - , saltos de linea) para respuestas agiles.

CONOCIMIENTO BASE UTELVT:
1) SAIA-SIAD: Sistema de Automatizacion de Identidad y Accesos de la UTELVT. Permite gestionar accesos, credenciales y tickets de soporte tecnologico para docentes, estudiantes y personal administrativo.
2) TICKETS DE SOPORTE: Para crear un ticket el usuario completa el formulario en su panel indicando categoria y descripcion. Categorias: Redes, Hardware, Software y Correo. Estados: PENDIENTE (en espera), EN_PROCESO (atendiendo), ATENDIDO (atendido por ingeniero) y RESUELTO (solucionado). El sistema asigna automaticamente al ingeniero con menor carga (tope 5 atenciones por hora).
3) CONTRASENAS Y CREDENCIALES: Si olvido su contrasena SIAD o de correo @utelvt.edu.ec, debe generar un ticket con la opcion "Reseteo SIAD", "Correo Institucional" o "Credenciales SIAD". No se comparten claves por este chat por seguridad.
4) RED WIFI INSTITUCIONAL: La red UTELVT-WiFi usa usuario con cedula institucional y la clave de acceso generate por soporte. Asegurate de estar en campus. Para configuracion del correo @utelvt.edu.ec en Outlook/Movil use IMAP y SMTP proporcionados por Soporte TI.
5) AULAS VIRTUALES Y PLATAFORMAS: El acceso a aulas virtuales y SIAD requiere credenciales activas. Si no entra, verifique estado del servicio o genere un ticket de Software.
6) ATENCION EN PERSONA Y CODIGO QR: Los ingenieros de soporte son Ing. Yeron Cuero, Ing. Hector Sacon e Ing. Luis Montano. La atencion presencial se da en el departamento de Soporte TI. El ticket incluye un comprobante con codigo QR que el ingeniero valida en tiempo real para confirmar la identidad del solicitante (resultado: VALIDO o YA FUE ATENDIDO).
7) HORARIOS: Soporte TI atiende de lunes a viernes de 08:00 a 17:00.

RESPONDE SOLO CON INFORMACION RELEVANTE AL CONTEXTO UTELVT/SAIA-SIAD, con amabilidad y brevedad.`

const FAQ = [
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'buenos', 'saludo', 'hey', 'holi', 'hello', 'saludos', 'que tal'],
    respuesta: `**¡Hola!** Soy el Asistente Virtual de **SAIA-SIAD** de la UTELVT. 👋

Puedo ayudarte con:
- **Contraseñas y credenciales** institucionales
- **Tickets de soporte** (cómo crearlos y sus estados)
- **Wi-Fi** y **correo** institucional
- **Atención presencial** con los ingenieros de soporte

¿En qué puedo ayudarte hoy?`,
  },
  {
    id: 'identidad',
    keywords: ['sistema', 'saia', 'siad', 'que es este sistema', 'automatizacion', 'identidad', 'plataforma sirve', 'para que sirve'],
    respuesta: `**SAIA-SIAD** es el *Sistema de Automatización de Identidad y Accesos* de la **Universidad Técnica Luis Vargas Torres de Esmeraldas**.

Permite:
- Gestionar **accesos y credenciales** institucionales
- Generar **tickets de soporte técnico**
- Coordinar **atención presencial** con los ingenieros de TI mediante **código QR**

¿Quieres saber cómo crear un ticket o recuperar tus credenciales?`,
  },
  {
    id: 'crear_cuenta',
    keywords: ['crear cuenta', 'registrarme', 'cuenta nueva', 'registro', 'usuario nuevo', 'crear usuario', 'darme de alta', 'inscribirme'],
    respuesta: `Para **crear tu cuenta** en SAIA-SIAD:

1. Haz clic en **"Registrarse"** en la pantalla de bienvenida.
2. Completa tus datos: **nombres, apellidos, correo institucional, cédula** y rol (Docente/Estudiante).
3. Selecciona tu **facultad y carrera**.
4. Confirma tu registro y podrás iniciar sesión.

Si olvidaste tu clave luego de registrarte, genera un ticket de *Reseteo SIAD*.`,
  },
  {
    id: 'reset',
    keywords: ['contra', 'clave', 'password', 'olvid', 'resetear', 'restablecer', 'cambiar clave', 'recuperar', 'bloqueado', 'acceso negado'],
    respuesta: `Para **restablecer tu contraseña** institucional:

1. Inicia sesión y ve a la sección de **nueva solicitud**.
2. Elige el motivo:
   - **Reseteo SIAD** (plataforma académica)
   - **Correo Institucional** (@utelvt.edu.ec)
   - **Credenciales SIAD**
3. Completa tu **cédula** y adjunta tu **cédula de identidad**.
4. Un ingeniero procesará el reseteo y te notificará.

> **Importante:** nunca compartas contraseñas por este chat.`,
  },
  {
    id: 'crear_ticket',
    keywords: ['crear ticket', 'hacer ticket', 'nueva solicitud', 'solicitud', 'reportar', 'reporte', 'problema', 'ayuda tecnica', 'falta algo', 'llevar ticket'],
    respuesta: `Para **crear un ticket de soporte**:

1. Desde tu panel, entra a **"Nueva Solicitud"**.
2. Elige la **categoría** de tu problema:
   - **Redes** (conectividad o Wi-Fi)
   - **Hardware** (equipos)
   - **Software** (plataformas y aplicaciones)
   - **Correo** (cuenta institucional)
3. Describe el problema y adjunta tu **cédula** si aplica.
4. Confirma. El sistema **asigna automáticamente** un ingeniero con menor carga (máx. 5 atenciones/hora).

Recibirás un **ticket con código QR** que podrás descargar como imagen y usar para la atención presencial.`,
  },
  {
    id: 'categorias',
    keywords: ['categoria', 'categorias', 'tipos de ticket', 'tipos de problema'],
    respuesta: `Las **categorías** de tickets de soporte son:

- **Redes** — Wi-Fi, cableado, conectividad
- **Hardware** — PC, impresora, monitor
- **Software** — SIAD, aulas virtuales, apps
- **Correo** — @utelvt.edu.ec, Outlook

Elige la que mejor describa tu inconveniente al crear la solicitud.`,
  },
  {
    id: 'estados',
    keywords: ['estado', 'estados', 'pendiente', 'en proceso', 'atendido', 'resuelto', 'avance', 'seguimiento', 'cuanto tarda'],
    respuesta: `Los **estados** de un ticket son:

- **PENDIENTE** — recibido y en espera de asignación
- **EN_PROCESO** — un ingeniero ya lo está atendiendo
- **ATENDIDO** — el ingeniero asistió al solicitante
- **RESUELTO** — problema solucionado y cerrado

Puedes ver el **estado en tiempo real** de tus tickets desde tu panel de usuario.`,
  },
  {
    id: 'consultar_ticket',
    keywords: ['consultar', 'estado ticket', 'donde veo', 'mis tickets', 'ver ticket', 'mi solicitud', 'seguimiento'],
    respuesta: `Para **consultar el estado de tu ticket**:

1. Entra a tu panel de usuario.
2. Ve a la sección de **"Mis Tickets" / Historial**.
3. Cada ticket muestra su **estado actual** (PENDIENTE, EN_PROCESO, ATENDIDO, RESUELTO).

Los cambios de estado se actualizan en tiempo real a través del sistema. También puedes validar el **código QR** de tu comprobante para verificar su vigencia.`,
  },
  {
    id: 'wifi',
    keywords: ['wifi', 'wi-fi', 'wireless', 'internet', 'conectarme', 'red institucional', 'no me conecta', 'no hay internet', 'conectividad'],
    respuesta: `Para conectarte a la **red Wi-Fi institucional**:

1. Busca la red **UTELVT-WiFi** en tu dispositivo.
2. Usa tu **cédula institucional** como usuario.
3. Usa la **clave de acceso** asignada por Soporte TI (los tickets de *Redes* la generan si la olvidaste).

> Consejo: en horas pico la señal puede saturarse; verifica también que tu contraseña no haya cambiado tras un reseteo de credenciales.`,
  },
  {
    id: 'correo',
    keywords: ['correo', 'gmail', 'outlook', 'email', 'mail', 'no me entra correo', 'bandeja', 'smtp', 'imap', 'uta', 'utelvt.edu.ec'],
    respuesta: `Sobre la **cuenta de correo institucional** @utelvt.edu.ec:

- Si **no entra el correo**, verifica que tu contraseña esté vigente o genera un ticket en la categoría **Correo** (*Reseteo de contraseña de correo*).
- Para configurarlo en **Outlook o tu móvil**, Solicita los parámetros **IMAP/SMTP** a Soporte TI (se entregan vía ticket, no se publican aquí).
- Las **credenciales de correo y SIAD** pueden estar sincronizadas; al restablecer una, la otra se actualiza.`,
  },
  {
    id: 'plataformas',
    keywords: ['aula virtual', 'plataforma', 'siad', 'moodle', 'campus virtual', 'notas', 'matricula', 'aplicacion'],
    respuesta: `Para **plataformas académicas** (SIAD, aulas virtuales):

- Las credenciales son las mismas que gestiona **SAIA-SIAD**.
- Si **no puedes entrar**, confirma que tu cuenta esté activa y no bloqueada, o genera un ticket de **Software**.
- Para soporte de notas, matrícula u horarios, contacta a tu **capacitador de facultad** o genera el ticket correspondiente.

Los **cuellos de botella del sistema** se reportan automáticamente al área de TI.`,
  },
  {
    id: 'ingenieros',
    keywords: ['ingeniero', 'ingenieros', 'tecnicos', 'soporte', 'quien', 'persona', 'encargado', 'atendera', 'especialista', 'nombres de'],
    respuesta: `El equipo de **Soporte TI** que atiende tickets es:

- **Ing. Yeron Cuero** — coordinador del sistema
- **Ing. Héctor Sacón** — soporte técnico
- **Ing. Luis Montaño** — soporte técnico

La asignación es **automática**: el sistema elige al ingeniero con menor carga (máx. **5 atenciones por hora**) para que tu solicitud se atienda lo antes posible.`,
  },
  {
    id: 'qr',
    keywords: ['qr', 'codigo', 'validar', 'comprobante', 'escaneo', 'escane', 'pulsera', 'verificar ticket'],
    respuesta: `Sobre el **código QR** de tu ticket:

- Cada ticket genera un **comprobante descargable (.PDF)** con su **QR**.
- El ingeniero lo **escanea en tiempo real** al momento de la atención presencial.
- El escaneo devuelve **TICKET VÁLIDO** (si puede atenderse) o **TICKET INVÁLIDO — YA FUE ATENDIDO** (si ya se usó).

> Guarda tu comprobante en el teléfono para mostrarlo al llegar a Soporte TI.`,
  },
  {
    id: 'horarios',
    keywords: ['horario', 'horarios', 'atencion', 'atienden', 'cuando', 'abierto', 'cierra', 'hora atienden', 'fines de semana'],
    respuesta: `**Horarios de atención** de Soporte TI:

- **Lunes a Viernes**: **08:00 – 17:00**
- Sábados, domingos y feriados: sin atención presencial.

En horarios hábiles los tickets se procesan con prioridad. Fuera de horario, las solicitudes quedan **PENDIENTE** y se retoman al día siguiente hábil.`,
  },
  {
    id: 'contacto',
    keywords: ['contacto', 'telefono', 'extension', 'donde esta', 'ubicacion', 'oficina', 'departamento', 'despacho'],
    respuesta: `**Ubicación y contacto** — Soporte TI:

- **Oficina**: Departamento de Soporte TI, campus de la UTELVT.
- **Correo institucional**: soporte@utelvt.edu.ec
- **Try**: elige un ticket de *Atención en Persona* y el sistema te asigna horario.

El comité de desarrolladores trabaja en mejoras continuas del sistema SAIA-SIAD.`,
  },
  {
    id: 'atencion_persona',
    keywords: ['en persona', 'presencial', 'atencion presencial', 'cita', 'turno', 'persona fisica', 'acercarme'],
    respuesta: `Para **atención presencial**:

1. Genera una solicitud con motivo **"Atención en Persona"**.
2. Elige **fecha y hora** disponible.
3. El sistema asigna **automáticamente** un ingeniero y crea tu **cita**.
4. Presenta tu **comprobante con QR** al llegar.

El ingeniero validará el código en tiempo real y procederá con tu soporte.`,
  },
  {
    id: 'gracias',
    keywords: ['gracias', 'genial', 'perfecto', 'excelente', 'buena respuesta', 'chau', 'adios'],
    respuesta: `¡**Con gusto!** 😊 Si necesitas algo más, aquí estoy.

Recuerda que también puedes:
- Crear un **ticket** desde tu panel
- Validar tu **código QR** antes de la atención
- Consultar el **estado** de tus solicitudes en tiempo real

¡Que tengas un excelente día!`,
  },
  {
    id: 'destinatario',
    keywords: ['a quien', 'a quien me dirijo', 'quien me atiende', 'con quien', 'donde voy'],
    respuesta: `Te atenderá una persona del equipo de **Soporte TI**:
- **Ing. Yeron Cuero**
- **Ing. Héctor Sacón**
- **Ing. Luis Montaño**

El sistema asigna al **ingeniero con menor carga** de trabajo en ese momento (máx. 5 atenciones por hora) y tu comprobante indica quién te atenderá.`,
  },
]

const QUICK_PILLS = [
  '¿Cómo restablecer mi contraseña?',
  '¿Cómo consultar el estado de mi ticket?',
  'Problemas con Wi-Fi institucional',
  'Horarios de atención de Soporte TI',
]

const RESPUESTA_DEFAULT = `**Hmm, no tengo una respuesta exacta para eso.** 😕

Puedo ayudarte con:
- **Contraseñas y credenciales**
- **Tickets de soporte** y sus estados
- **Wi-Fi y correo** institucional
- **Ingenieros de soporte** y código **QR**

O también puedes crear un **ticket** desde tu panel y un ingeniero te atenderá personalmente.`

const WELCOME_MESSAGE = `¡Hola! Soy el **Asistente Virtual SAIA-SIAD** 🤖

Soy el bot de soporte de la **UTELVT**. Puedo ayudarte con tickets, credenciales, Wi-Fi, correo institucional y más.

Elige una pregunta rápida abajo o escribe lo que necesites.`

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function bestMatch(pregunta, ingresos = FAQ) {
  const q = normalizar(pregunta)
  let mejor = null
  let mejorScore = 0
  for (const entry of ingresos) {
    let score = 0
    for (const kw of entry.keywords) {
      const k = normalizar(kw)
      if (q.includes(k)) score += k.length
    }
    if (score > mejorScore) {
      mejorScore = score
      mejor = entry
    }
  }
  return mejor
}

async function requestIA(texto) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (key) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: texto }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim()) return text.trim()
      }
    } catch {
      // fallback al motor local
    }
  }
  const match = bestMatch(texto)
  if (match) return match.respuesta
  return RESPUESTA_DEFAULT
}

function inlineMarkdown(texto) {
  const parts = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

function renderMarkdown(texto) {
  if (!texto) return null
  const lines = texto.split(/\r?\n/)
  const nodos = []
  let bufferedList = []
  let keyCounter = 0
  const flushList = () => {
    if (bufferedList.length) {
      nodos.push(
        <ul key={`ul-${keyCounter++}`} className="mt-1.5 space-y-1">
          {bufferedList.map((item, j) => (
            <li key={j} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      bufferedList = []
    }
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('- ') || t.startsWith('* ')) {
      bufferedList.push(t.slice(2))
      continue
    }
    flushList()
    if (t.startsWith('> ')) {
      nodos.push(
        <blockquote key={keyCounter++} className="mt-1.5 rounded-r-lg border-l-2 border-emerald-500/60 bg-emerald-500/5 px-3 py-1.5 italic text-emerald-100/80">
          {inlineMarkdown(t.slice(2))}
        </blockquote>
      )
      continue
    }
    nodos.push(<p key={keyCounter++}>{inlineMarkdown(t)}</p>)
  }
  flushList()
  return nodos
}

export default function ChatbotWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const firstOpen = useRef(true)

  useEffect(() => {
    if (firstOpen.current && isOpen) {
      firstOpen.current = false
      setMessages([{ id: Date.now(), sender: 'bot', text: WELCOME_MESSAGE }])
    }
  }, [isOpen])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      const t = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
      return () => cancelAnimationFrame(t)
    }
  }, [messages, typing, isOpen])

  const enviar = useCallback(
    async (texto) => {
      const clean = texto.trim()
      if (!clean || typing) return
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: clean }])
      setInput('')
      setTyping(true)
      try {
        const respuesta = await requestIA(clean)
        setMessages((prev) => [...prev, { id: Date.now(), sender: 'bot', text: respuesta }])
      } catch {
        setError('Lo siento, algo salió mal al procesar tu consulta. Intenta de nuevo.')
      } finally {
        setTyping(false)
      }
    },
    [typing]
  )

  const limpiarChat = () => {
    setMessages([{ id: Date.now(), sender: 'bot', text: WELCOME_MESSAGE }])
    setTyping(false)
    setError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    enviar(input)
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/90 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl transition-all duration-300 sm:w-[400px]"
          >
            {/* HEADER FIJO (shrink-0) */}
            <div className="flex shrink-0 items-center justify-between border-b border-emerald-500/20 bg-slate-800/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/chat-bot-utlvte.png"
                  className="h-9 w-9 rounded-xl object-contain"
                  alt="Bot"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">Asistente SAIA-SIAD</h3>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                    En línea
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={limpiarChat}
                  title="Limpiar chat"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Cerrar"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ÁREA DE MENSAJES (única con scroll: flex-1 overflow-y-auto) */}
            <div
              ref={scrollRef}
              className="chat-scroll custom-scrollbar flex-1 space-y-3 overflow-y-auto bg-slate-900/40 p-4"
            >
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {QUICK_PILLS.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => enviar(pill)}
                      className="rounded-full border border-emerald-500/30 bg-slate-800/70 px-3 py-1 text-[11px] text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-600/30"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-md ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white'
                        : 'border border-emerald-500/15 bg-slate-800/85 text-slate-100'
                    }`}
                  >
                    {m.sender === 'bot' ? renderMarkdown(m.text) : <span className="whitespace-pre-wrap">{m.text}</span>}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/15 bg-slate-800/85 px-4 py-3 shadow-md">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs text-rose-200">{error}</p>
                </div>
              )}
            </div>

            {/* INPUT Y BOTÓN ENVIAR FIJOS (shrink-0) */}
            <div className="shrink-0 border-t border-emerald-500/20 bg-slate-900/95 p-3">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu consulta..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-4 pr-12 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="absolute right-2 rounded-lg bg-emerald-600 p-2 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRIGGER: visible SOLO cuando el chat está cerrado */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente virtual"
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.25 }}
        >
          <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/30 blur-xl transition group-hover:bg-emerald-400/40" />
          <span className="absolute inset-1 animate-ping rounded-full bg-emerald-500/10" />
          <img
            src="/assets/chat-bot-utlvte.png"
            alt="Bot de soporte UTELVT"
            className="h-full w-full rounded-full object-cover shadow-[0_0_25px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/40 transition group-hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] group-hover:ring-emerald-300/60"
          />
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-green-400/60" />
            <span className="relative h-3 w-3 rounded-full border-2 border-slate-900 bg-green-400" />
          </span>
        </motion.button>
      )}
    </>
  )
}