import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Loader2, MessageCircle, Paperclip, SendHorizonal, Smile, X } from 'lucide-react'
import { io } from 'socket.io-client'
import { api } from '../../lib/api'
import { socketUrl, ROL_LABEL } from '../../lib/institucional'

const MAX_ADJUNTO = 5 * 1024 * 1024

const EMOJIS = ['🙂','😀','😄','😊','😉','😍','😘','😜','🤔','😴','😭','😱','👍','👏','🙌','🤝','💪','🙏','✨','🎉','❤️','🔥','✅','❌','⚠️','📌','💡','🚀','📎','🖥️','📱','🔐','⏰','☕','🍀','🌿','🎓','🏫','📚','✍️']

const AVATAR_GRAD = {
  SOPORTE_TI: 'bg-linear-to-br from-green-600 to-emerald-400',
  SUPER_ADMIN: 'bg-linear-to-br from-slate-700 to-slate-900',
  default: 'bg-linear-to-br from-amber-400 to-orange-500',
}

function iniciales(nombre = '', apellido = '') {
  return `${(nombre || ' ?').trim().charAt(0)}${(apellido || '').trim().charAt(0)}`.toUpperCase() || '?'
}

function hora(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

export default function TicketChat({ ticket, currentUser, isAdmin }) {
  const ticketId = ticket?.id
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const fileRef = useRef(null)
  const listRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimer = useRef(null)

  const scrollDown = useCallback(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    if (!ticketId) return

    let socket = null
    try {
      socket = io(socketUrl(), {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        auth: { token: localStorage.getItem('token') || '' },
      })
      socketRef.current = socket
      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))
      socket.on('connect_error', () => setConnected(false))
    } catch {
      setConnected(false)
    }

    const onNewMessage = (msg) => {
      if (msg?.ticketId !== ticketId) return
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      scrollDown()
    }

    const onMessagesRead = ({ ticketId: tid }) => {
      if (tid !== ticketId) return
      setMessages((prev) => prev.map((m) => (m.senderId !== currentUser?.id ? { ...m, isRead: true } : m)))
    }

    const onTyping = ({ ticketId: tid, isTyping, usuario }) => {
      if (tid !== ticketId || usuario?.id === currentUser?.id) return
      setTyping(Boolean(isTyping))
    }

    if (socket) {
      socket.on('new_message', onNewMessage)
      socket.on('messages_read', onMessagesRead)
      socket.on('typing_indicator', onTyping)
      socket.emit('join_ticket_room', { ticketId })
    }

    api
      .get(`/tickets/${ticketId}/messages`)
      .then((res) => {
        setMessages(res.data.messages || [])
        if (socket?.connected) socket.emit('mark_read', { ticketId })
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        scrollDown()
      })

    return () => {
      if (socket) {
        socket.off('new_message', onNewMessage)
        socket.off('messages_read', onMessagesRead)
        socket.off('typing_indicator', onTyping)
        socket.disconnect()
      }
      socketRef.current = null
    }
  }, [ticketId, currentUser?.id, scrollDown])

  useEffect(() => {
    scrollDown()
  }, [messages, scrollDown])

  const emitTyping = (value) => {
    if (!socketRef.current) return
    socketRef.current.emit('typing_status', { ticketId, isTyping: value })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      if (socketRef.current) socketRef.current.emit('typing_status', { ticketId, isTyping: false })
    }, 1200)
  }

  const handleSend = async () => {
    const mensaje = text.trim()
    if (!mensaje && attachments.length === 0) return
    if (!socketRef.current?.connected) return

    setSending(true)
    let liberado = false
    const liberar = () => {
      if (liberado) return
      liberado = true
      setSending(false)
    }
    const timeout = setTimeout(liberar, 8000)

    socketRef.current.emit(
      'send_message',
      { ticketId, message: mensaje, attachments },
      (err, msg) => {
        clearTimeout(timeout)
        liberar()
        if (!err && msg) {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
          setText('')
          setAttachments([])
          scrollDown()
        }
      },
    )
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (file.size > MAX_ADJUNTO) {
        alert('El archivo excede el límite de 5 MB')
        return
      }
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.uploadFile('/upload/chat', formData)
      setAttachments((prev) => [
        ...prev,
        {
          url: res.data.url,
          fileName: file.name,
          mimeType: res.data.mimeType || file.type || 'application/octet-stream',
          size: file.size,
        },
      ])
    } catch (err) {
      if (err.message) alert(err.message)
    } finally {
      e.target.value = ''
    }
  }

  const removerAdjunto = (url) => setAttachments((prev) => prev.filter((a) => a.url !== url))

  const insertarEmoji = (emoji) => {
    setText((prev) => `${prev}${emoji}`)
    setEmojiOpen(false)
  }

  const typingLabel = useMemo(() => {
    if (!typing) return ''
    return isAdmin ? 'El usuario está escribiendo…' : 'Soporte TI está escribiendo…'
  }, [typing, isAdmin])

  return (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-green-600/10 bg-white">
      <div className="flex items-center justify-between border-b border-green-600/10 bg-green-50/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-700" aria-hidden="true" />
          <h3 className="text-sm font-extrabold text-green-800">Chat de seguimiento</h3>
          <span
            className={`ml-1 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {connected ? 'En línea' : 'Sin conexión'}
          </span>
        </div>
        <span className="font-mono text-[10px] font-black text-slate-400">{ticket?.numero}</span>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-8 w-8 text-green-300" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-500">Aún no hay mensajes</p>
            <p className="text-xs font-semibold text-slate-400">
              Inicie la conversación para dar seguimiento a {ticket?.numero}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const propio = msg.senderId === currentUser?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${propio ? 'justify-end' : 'justify-start'}`}
              >
                {!propio && (
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${
                      AVATAR_GRAD[msg.sender?.rol] || AVATAR_GRAD.default
                    }`}
                    title={[msg.sender?.nombre, msg.sender?.apellido].filter(Boolean).join(' ') || 'Usuario'}
                  >
                    {iniciales(msg.sender?.nombre, msg.sender?.apellido)}
                  </span>
                )}
                <div className={`max-w-[75%] ${propio ? 'items-end' : ''}`}>
                  {!propio && (
                    <p className="mb-0.5 ml-1 text-[10px] font-extrabold text-slate-500">
                      {[msg.sender?.nombre, msg.sender?.apellido].filter(Boolean).join(' ') || 'Usuario'}
                      <span className="ml-1 font-bold text-slate-400">
                        {ROL_LABEL[msg.sender?.rol] || msg.sender?.rol || ''}
                      </span>
                    </p>
                  )}
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      propio
                        ? 'rounded-br-sm bg-green-600 text-white'
                        : 'rounded-bl-sm bg-green-50 text-ink ring-1 ring-green-600/10'
                    }`}
                  >
                    {msg.message && <p className="whitespace-pre-wrap break-words leading-5">{msg.message}</p>}
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.attachments.map((att) => (
                          <AdjuntoBurbuja key={att.url} att={att} propio={propio} />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`mt-0.5 text-[9px] font-bold text-slate-400 ${propio ? 'text-right' : 'ml-1'}`}>
                    {hora(msg.createdAt)}
                    {propio && (msg.isRead ? ' · Leído' : ' · Entregado')}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
        <AnimatePresence>
          {typingLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-bold text-slate-400"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:0.3s]" />
                </span>
              </span>
              {typingLabel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-green-600/10 bg-green-50/40 px-4 py-2">
          {attachments.map((att) => (
            <span
              key={att.url}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-green-800 ring-1 ring-green-600/10"
            >
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              <span className="max-w-36 truncate">{att.fileName}</span>
              <button
                onClick={() => removerAdjunto(att.url)}
                className="ml-1 text-slate-400 hover:text-red-600"
                aria-label={`Quitar adjunto ${att.fileName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative flex items-center gap-2 border-t border-green-600/10 px-4 py-3">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />

        <AnimatePresence>
          {emojiOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEmojiOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute bottom-14 left-0 z-50 grid w-72 grid-cols-8 gap-1 rounded-2xl border border-green-600/10 bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertarEmoji(emoji)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg transition-colors hover:bg-green-100"
                    aria-label={`Insertar ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button
          onClick={() => setEmojiOpen((v) => !v)}
          className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors ${
            emojiOpen ? 'bg-green-100 text-green-700' : 'text-green-700 hover:bg-green-100'
          }`}
          aria-label="Insertar emoji"
          title="Emojis"
        >
          <Smile className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-green-700 transition-colors hover:bg-green-100"
          aria-label="Adjuntar archivo"
          title="Adjuntar imagen o PDF (max 5 MB)"
        >
          <Paperclip className="h-5 w-5" aria-hidden="true" />
        </button>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            emitTyping(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="field max-h-28 min-h-10 flex-1 resize-none py-2"
          aria-label="Mensaje"
        />
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && attachments.length === 0)}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-green-600 text-white shadow-[0_4px_12px_rgb(0,102,51,0.25)] transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Enviar mensaje"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <SendHorizonal className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function AdjuntoBurbuja({ att, propio }) {
  const base = propio
    ? 'bg-white/20 text-white hover:bg-white/30 border-white/20'
    : 'bg-white text-green-800 ring-1 ring-green-600/10 hover:bg-green-50'

  if ((att.mimeType || '').startsWith('image/')) {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noreferrer"
        className="block max-w-64 overflow-hidden rounded-lg ring-1 ring-black/10 transition-transform hover:scale-[1.02]"
        title="Abrir imagen"
      >
        <img src={att.url} alt={att.fileName || 'Imagen adjunta'} className="max-h-44 w-full object-cover" loading="lazy" />
      </a>
    )
  }

  if ((att.mimeType || '').toLowerCase().includes('pdf') || (att.fileName || '').toLowerCase().endsWith('.pdf')) {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noreferrer"
        className={`flex w-56 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-colors ${base}`}
        title="Ver PDF"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${propio ? 'bg-white/25 text-white' : 'bg-red-50 text-red-700'}`}>
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate">{att.fileName || 'Documento.pdf'}</span>
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    )
  }

  return (
    <a
      href={att.url}
      target="_blank"
      rel="noreferrer"
      className={`flex w-56 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-colors ${base}`}
      title="Descargar archivo"
    >
      <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{att.fileName || att.url}</span>
    </a>
  )
}