import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, HardHat, Loader2, User, X } from 'lucide-react'
import { api } from '../../lib/api'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

const FOTO_PATHS = {
  'hector-sacon': '/fotos/hector-sacon.jpg',
  'luis-montano': '/fotos/luis-montano.jpg',
  'yeron-pool': '/fotos/yeron-pool.jpg',
}

export default function IngenierosModal({ open, onClose, formPayload, onSuccess }) {
  const [ingenieros, setIngenieros] = useState([])
  const [loading, setLoading] = useState(true)
  const [seleccion, setSeleccion] = useState(null)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  const bloque = formPayload?.horario?.hora || ''

  useEffect(() => {
    if (!open) return
    setSeleccion(null)
    setError('')
    setLoading(true)

    const query = formPayload?.horario
      ? `?fecha=${encodeURIComponent(formPayload.horario.fecha)}&hora=${encodeURIComponent(formPayload.horario.hora)}`
      : ''

    api.get(`/citas/ingenieros${query}`)
      .then((res) => setIngenieros(res.data))
      .catch(() => setError('Error al cargar los especialistas'))
      .finally(() => setLoading(false))
  }, [open, formPayload?.horario?.fecha, formPayload?.horario?.hora])

  const handleConfirmar = async () => {
    if (!seleccion || !formPayload) return
    setCreando(true)
    setError('')

    try {
      let fotoCedulaUrl = ''
      if (formPayload.archivoCedula) {
        const formData = new FormData()
        formData.append('foto', formPayload.archivoCedula)
        const uploadRes = await api.uploadFile('/upload/cedula', formData)
        fotoCedulaUrl = uploadRes.data.url
      }

      const MOTIVO_LABEL = {
        'atencion-persona': 'Atencion en Persona',
      }

      const ticketRes = await api.post('/tickets', {
        titulo: `Solicitud de ${MOTIVO_LABEL[formPayload.motivoSolicitud] || formPayload.motivoSolicitud} - ${formPayload.programaAcademico}`,
        descripcion: formPayload.descripcion,
        tipo: 'OTRO',
        cedula: formPayload.cedulaIdentidad || '',
        fotoCedulaUrl,
        atencionEnPersona: true,
        metadata: {
          cedula: formPayload.cedulaIdentidad || '',
          rol: formPayload.rolUsuario,
          facultad: formPayload.facultad,
          facultadNombre: formPayload.facultadNombre,
          carrera: formPayload.carrera,
          cargo: formPayload.cargo,
        },
      })

      const ticketId = ticketRes.data.id

      const citaRes = await api.post('/citas', {
        ticketId,
        ingenieroId: seleccion,
        fecha: formPayload.horario.fecha,
        hora: formPayload.horario.hora,
      })

      onSuccess?.(citaRes.data.ticketDigital)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al procesar la solicitud')
    } finally {
      setCreando(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-green-600/10 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.2)]"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ingenieros-title"
          >
            <div className="flex items-center justify-between border-b border-green-600/10 bg-linear-to-br from-green-50 to-white px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
                  <HardHat className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="ingenieros-title" className="text-h3 text-ink">Asignacion de Especialista Tecnico de Soporte</h2>
                  {formPayload?.horario && (
                    <p className="text-xs font-bold text-slate-500">
                      Turno: {formPayload.horario.fecha} - {formPayload.horario.hora}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>
                      Elige al especialista que te atenderá. Los cupos por bloque se actualizan en tiempo real;
                      si el especialista alcanzó su aforo ({' '}
                      {ingenieros[0]?.capacidadBloque ?? '5'} por hora) quedará bloqueado.
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-600">
                    Selecciona el especialista para tu turno del {formPayload?.horario?.hora}:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {ingenieros.map((ingeniero) => {
                      const sinCupos = ingeniero.ocupado || ingeniero.cuposDisponibles <= 0
                      const disponible = !sinCupos
                      return (
                        <button
                          key={ingeniero.id}
                          disabled={!disponible}
                          onClick={() => { setSeleccion(ingeniero.id); setError('') }}
                          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                            sinCupos
                              ? 'cursor-not-allowed border-red-100 bg-red-50/50 opacity-60'
                              : seleccion === ingeniero.id
                                ? 'border-green-500 bg-green-50 shadow-[0_8px_24px_rgb(0,102,51,0.12)]'
                                : 'border-green-600/10 bg-white hover:border-green-300 hover:shadow-[0_4px_16px_rgb(0,102,51,0.06)]'
                          }`}
                        >
                          <div className="mb-3 flex justify-center">
                            <div className={`h-20 w-20 overflow-hidden rounded-full border-2 ${sinCupos ? 'border-red-200 grayscale' : 'border-green-200'} bg-green-50`}>
                              <img
                                src={FOTO_PATHS[ingeniero.id]}
                                alt={ingeniero.nombre}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            </div>
                          </div>
                          <p className={`text-center text-sm font-extrabold ${sinCupos ? 'text-slate-400' : 'text-ink'}`}>{ingeniero.nombre}</p>
                          <p className="mt-0.5 text-center text-[10px] font-bold text-slate-400">{ingeniero.especialidad}</p>
                          <div className="mt-2 flex items-center justify-center gap-1.5">
                            {sinCupos ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-extrabold text-red-700">
                                <X className="h-3 w-3" aria-hidden="true" />
                                SIN CUPOS
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                                seleccion === ingeniero.id ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                              }`}>
                                <Check className="h-3 w-3" aria-hidden="true" />
                                {ingeniero.cuposDisponibles} cupo{ingeniero.cuposDisponibles !== 1 ? 's' : ''} / {ingeniero.capacidadBloque}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            <User className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            <span className="text-[10px] font-bold text-slate-500">{ingeniero.usuariosEnEspera} en espera</span>
                          </div>
                          {seleccion === ingeniero.id && (
                            <motion.span
                              layoutId="check-ingeniero"
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleConfirmar}
                    disabled={!seleccion || creando}
                    className="btn-primary flex w-full items-center justify-center gap-2"
                  >
                    {creando ? (
                      <>
                        <Loader2 className="relative z-10 h-5 w-5 animate-spin" />
                        <span className="relative z-10">Reservando tu turno...</span>
                      </>
                    ) : (
                      <>
                        <Check className="relative z-10 h-5 w-5" />
                        <span className="relative z-10">Confirmar Asignacion y Cita</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}