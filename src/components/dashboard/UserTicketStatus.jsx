import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  RefreshCcw,
  XCircle,
} from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import TicketChat from './TicketChat'
import { api } from '../../lib/api'
import { TICKET_ESTADO_META, ticketEstadoLabel, ESTADOS_FINALES, ESTADOS_EDITABLES_USUARIO } from '../../lib/institucional'

const formatFecha = (fecha) => (fecha ? new Date(fecha).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const CARD_ANIM = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 24 },
}

function BadgeEstado({ estado }) {
  const meta = TICKET_ESTADO_META[estado] || { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {ticketEstadoLabel(estado)}
    </span>
  )
}

export default function UserTicketStatus({ user }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const fetchMisTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/tickets?limit=50')
      setTickets(res.data || [])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMisTickets()
  }, [fetchMisTickets])

  const solicitarCancelacion = async () => {
    if (!cancelTarget) return
    setBusy(true)
    setError('')
    try {
      await api.patch(`/tickets/${cancelTarget.id}/cancel-user`, { reason })
      setFeedback(`Solicitud ${cancelTarget.numero} cancelada correctamente.`)
      setCancelTarget(null)
      setReason('')
      await fetchMisTickets()
      setTimeout(() => setFeedback(''), 5000)
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la solicitud')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6">
      <SpotlightCard className="p-6">
        <div className="relative z-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-caption mb-1 text-green-700">Seguimiento</p>
              <h2 className="text-h3 text-ink">Mis tramites</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Consulte el estado de sus solicitudes y comuniquese con Soporte TI en tiempo real.
              </p>
            </div>
            <button
              onClick={fetchMisTickets}
              className="flex min-h-10 cursor-pointer items-center gap-2 self-start rounded-xl border border-green-600/10 bg-white px-3 py-2 text-xs font-extrabold text-green-700 transition-colors hover:bg-green-50 sm:self-auto"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refrescar
            </button>
          </div>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {feedback}
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-7 w-7 animate-spin text-green-600" aria-hidden="true" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <TicketEmptyIcon />
              <p className="text-sm font-extrabold text-slate-500">No tiene solicitudes registradas</p>
              <p className="text-xs font-semibold text-slate-400">Cuando envie una solicitud, aparecera aqui con su numero de tramite.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const abierto = expandedId === ticket.id
                const editable = ESTADOS_EDITABLES_USUARIO.includes(ticket.estado)
                const finalizado = ESTADOS_FINALES.includes(ticket.estado)
                const esCasoEspecial = ticket.estado === 'CASO_ESPECIAL' || ticket.isSpecialCase
                return (
                  <motion.div key={ticket.id} {...CARD_ANIM}>
                    <div className="overflow-hidden rounded-2xl border border-green-600/10 bg-white transition-shadow hover:shadow-[0_8px_24px_rgb(0,102,51,0.08)]">
                      <button
                        onClick={() => setExpandedId(abierto ? null : ticket.id)}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
                        aria-expanded={abierto}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                          <CalendarDays className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-xs font-black text-ink">{ticket.numero}</span>
                          <span className="mt-0.5 block truncate text-sm font-bold text-slate-600">{ticket.titulo}</span>
                          <span className="mt-0.5 block text-[10px] font-bold text-slate-400">Creado {formatFecha(ticket.createdAt)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <BadgeEstado estado={ticket.estado} />
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </span>
                      </button>

                      {esCasoEspecial && (
                        <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                          <p className="text-xs font-extrabold leading-5 text-amber-900">
                            ATENCION REQUERIDA: su tramite ha sido calificado como Caso Especial. Acercate directamente a las
                            oficinas de TICS. Su atencion es PRIORITARIA y no requiere agendar un nuevo turno.
                          </p>
                        </div>
                      )}

                      <AnimatePresence>
                        {abierto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 border-t border-green-600/10 px-4 py-4">
                              {ticket.cancellationReason && (
                                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-800">
                                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                  <span>
                                    <span className="font-black">Motivo de cancelacion: </span>
                                    {ticket.cancellationReason}
                                  </span>
                                </div>
                              )}
                              {ticket.resolucion && (
                                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-5 text-emerald-800">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                  <span>
                                    <span className="font-black">Solucion: </span>
                                    {ticket.resolucion}
                                  </span>
                                </div>
                              )}

                              {editable && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      setCancelTarget(ticket)
                                      setReason('')
                                      setError('')
                                    }}
                                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-700 transition-all hover:bg-red-50 hover:ring-2 hover:ring-red-100"
                                  >
                                    <XCircle className="h-4 w-4" aria-hidden="true" />
                                    Cancelar solicitud de tramite
                                  </button>
                                </div>
                              )}

                              {finalizado && !ticket.cancellationReason && (
                                <p className="text-right text-[11px] font-bold text-slate-400">
                                  Este tramite ya esta finalizado.
                                </p>
                              )}

                              <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-green-700">
                                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                  Chat con Soporte TI
                                </div>
                                <TicketChat ticket={ticket} currentUser={user} isAdmin={false} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </SpotlightCard>

      <ConfirmCancelModal
        open={Boolean(cancelTarget)}
        ticket={cancelTarget}
        reason={reason}
        setReason={setReason}
        busy={busy}
        error={error}
        onConfirm={solicitarCancelacion}
        onClose={() => setCancelTarget(null)}
      />
    </section>
  )
}

function TicketEmptyIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-300">
      <CalendarDays className="h-6 w-6" aria-hidden="true" />
    </span>
  )
}

function ConfirmCancelModal({ open, ticket, reason, setReason, busy, error, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open && ticket && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-h3 text-ink">Cancelar solicitud</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Esta a punto de cancelar el tramite <span className="font-mono font-black text-ink">{ticket.numero}</span>. Esta
                  accion no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="cancel-reason" className="mb-1 block text-xs font-extrabold text-slate-600">
                Motivo de cancelacion *
              </label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="field"
                placeholder="Ej: Ya pude solucionar el problema por mi cuenta."
              />
              {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="flex min-h-10 cursor-pointer items-center rounded-xl border border-green-600/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-600 transition-colors hover:bg-green-50"
              >
                Volver
              </button>
              <button
                onClick={onConfirm}
                disabled={busy || reason.trim().length < 5}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white shadow-[0_4px_12px_rgb(220,38,38,0.3)] transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Confirmar cancelacion
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}