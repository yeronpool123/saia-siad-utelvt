import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Check, Download, HardHat, Image, Loader2, Scissors, User, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import html2canvas from 'html2canvas'
import SaiaLogo from '../brand/SaiaLogo'
import { SCALE_TAP } from '../../lib/motion'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 40, rotate: -2 },
  visible: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit: { opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.22 } },
}

function formatFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(`${fecha}T12:00:00`)
  return d.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

const DetailRow = ({ icon: Icon, label, value, subvalue }) => (
  <div className="flex items-start gap-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="truncate text-sm font-extrabold text-ink">{value || '-'}</p>
      {subvalue && <p className="text-xs font-bold text-green-700">{subvalue}</p>}
    </div>
  </div>
)

export default function TicketComprobanteModal({ open, onClose, ticket }) {
  const ticketRef = useRef(null)
  const [generando, setGenerando] = useState(false)
  const [descargado, setDescargado] = useState(false)

  if (!ticket) return null

  const codigo = ticket.codigo || '-'
  const cedula = ticket.cedula || ''
  const qrValue = ticket.qrPayload || String(codigo)

  const handleDownloadJpg = async () => {
    if (!ticketRef.current || generando) return
    setGenerando(true)
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `Ticket_SAIA_${codigo.replace(/\s+/g, '_')}${cedula ? `_${cedula}` : ''}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
      setDescargado(true)
      window.setTimeout(() => setDescargado(false), 4000)
    } catch {
      setDescargado(true)
      window.setTimeout(() => setDescargado(false), 4000)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            variants={backdropVariants}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-md"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-title"
          >
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
              <div ref={ticketRef}>
                <div className="border-t-8 border-green-600">
                  <div className="bg-linear-to-br from-green-700 to-green-500 px-6 py-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/95">
                          <SaiaLogo compact />
                        </span>
                        <div className="text-white">
                          <p className="text-sm font-black tracking-wide">UTELVT</p>
                          <p className="text-[10px] font-bold text-green-100">Universidad Tecnica Luis Vargas Torres</p>
                          <p className="text-[9px] font-semibold text-green-200">SAIA-SIAD</p>
                        </div>
                      </div>
                      <div className="text-right text-white">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-green-100">Ticket N°</p>
                        <p className="text-sm font-black sm:text-base">{codigo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <div className="mb-5 text-center">
                      <p className="text-caption mb-1 text-green-700">Cita confirmada</p>
                      <h2 id="ticket-title" className="text-h3 text-ink">Comprobante de Cita Asignada</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="space-y-4">
                        <DetailRow
                          icon={HardHat}
                          label="Especialista Tecnico de Soporte"
                          value={ticket.ingeniero}
                          subvalue={ticket.especialidad}
                        />
                        <DetailRow
                          icon={Calendar}
                          label="Fecha de Atencion"
                          value={formatFecha(ticket.fecha)}
                        />
                        <DetailRow
                          icon={User}
                          label="Hora del Turno"
                          value={ticket.hora}
                          subvalue={cedula ? `Cedula: ${cedula}` : ''}
                        />
                        <div className="flex justify-center">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">PENDIENTE</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-600/10 bg-white p-4 shadow-[0_8px_24px_rgb(0,102,51,0.08)]">
                        <div className="rounded-xl bg-white p-2 ring-2 ring-green-600/20">
                          <QRCodeCanvas
                            value={qrValue}
                            size={140}
                            level="M"
                            marginSize={2}
                            aria-label={`QR del ticket ${codigo}`}
                          />
                        </div>
                        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-500">Escanee este QR</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="ticket-perforated h-5 border-y border-dashed border-green-600/30" />
                    <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-green-50 text-green-700">
                      <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="bg-green-50 px-6 py-4 text-center">
                    <p className="mx-auto max-w-xs text-[11px] font-bold leading-5 text-green-900">
                      Presente este comprobante el dia de su cita. En caso de requerimientos de reseteo,
                      su identidad sera validada con la cedula registrada.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-green-600/10 px-6 py-4">
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                  <span className="text-amber-600"> Importante:</span> Por favor descarga tu ticket en formato JPG o toma una captura de pantalla clara. Deberás presentar el código QR de este comprobante el día de tu cita.
                </div>
                <AnimatePresence>
                  {descargado && (
                    <motion.div
                      key="nota-descarga"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-extrabold text-green-800"
                      role="status"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      El comprobante fue descargado correctamente como imagen JPG.
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <motion.button
                    onClick={handleDownloadJpg}
                    disabled={generando}
                    {...SCALE_TAP}
                    className="btn-primary flex flex-1 items-center justify-center gap-2"
                  >
                    {generando ? (
                      <>
                        <Loader2 className="relative z-10 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span className="relative z-10">Preparando JPG...</span>
                      </>
                    ) : (
                      <>
                        <Image className="relative z-10 h-4 w-4" aria-hidden="true" />
                        <span className="relative z-10">Descargar Ticket (.JPG)</span>
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-600/15 bg-white px-5 text-sm font-extrabold text-green-700 transition-colors hover:bg-green-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}