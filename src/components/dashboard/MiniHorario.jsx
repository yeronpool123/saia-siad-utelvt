import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Loader2, Sun, Sunset, AlertCircle, Info } from 'lucide-react'
import { api } from '../../lib/api'
import { getDiasLaborables, esDiaLaborable, formatFechaLabel, BLOQUES_HORARIOS } from '../../lib/institucional'

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-EC', { weekday: 'short' })
}

function isPastSlot(hora) {
  const hoy = new Date()
  const inicioLabel = BLOQUES_HORARIOS.find((b) => b.hora === hora)?.inicio || hora.split(' - ')[0]
  const [time, meridiem] = inicioLabel.split(' ')
  const [hh, mm] = time.split(':').map(Number)
  let horas = hh
  if (meridiem === 'PM' && hh !== 12) horas += 12
  if (meridiem === 'AM' && hh === 12) horas = 0
const horaActual = hoy.getHours() * 60 + hoy.getMinutes()
    const bloqueMin = horas * 60 + mm
    return horaActual >= bloqueMin
}

function isToday(dateStr) {
  const hoy = new Date()
  return dateStr === hoy.toISOString().split('T')[0]
}

export default function MiniHorario({ value, onChange, fechaSeleccionada: propFechaSeleccionada, setFechaSeleccionada: propSetFecha }) {
  const weekDates = getDiasLaborables(10)
  const [fechaSeleccionada, actualizarFecha] = useState(propFechaSeleccionada || value?.fecha || '')
  const setFechaSeleccionada = propSetFecha || actualizarFecha
  const [disponibilidad, setDisponibilidad] = useState([])
  const [dayMeta, setDayMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (fechaSeleccionada && propFechaSeleccionada !== undefined && fechaSeleccionada !== propFechaSeleccionada) {
      setFechaSeleccionada(propFechaSeleccionada)
    }
  }, [propFechaSeleccionada, fechaSeleccionada, setFechaSeleccionada])

  useEffect(() => {
    if (!fechaSeleccionada) {
      setDisponibilidad([])
      setDayMeta(null)
      return
    }
    setLoading(true)
    setError('')
    api.get(`/citas/disponibilidad?fecha=${fechaSeleccionada}`)
      .then((res) => {
        setDisponibilidad(res.data.horarios || [])
        setDayMeta({
          diaNoLaborable: res.data.diaNoLaborable,
          motivo: res.data.motivo,
          fecha: res.data.fecha,
        })
      })
      .catch(() => setError('No se pudo cargar la disponibilidad'))
      .finally(() => setLoading(false))
  }, [fechaSeleccionada])

  const handleSelectSlot = (hora, jornada) => {
    onChange({ fecha: fechaSeleccionada, hora, jornada })
  }

  const selectedHora = value?.hora || ''
  const manana = disponibilidad.filter((h) => h.jornada === 'manana')
  const tarde = disponibilidad.filter((h) => h.jornada === 'tarde')

  const esHoy = isToday(fechaSeleccionada)
  const laborable = esDiaLaborable(fechaSeleccionada)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-green-600/10 bg-green-50/30 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-700" />
          <p className="text-sm font-extrabold text-green-800">Mini-Horario Interactivo</p>
          <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-extrabold text-green-700">
            08:00 AM - 04:30 PM
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-green-700">Selecciona un dia laborable (Lun - Vie, sin feriados)</p>
          <div className="flex flex-wrap gap-2">
            {weekDates.map((date) => {
              const disabled = !esDiaLaborable(date)
              const isSelected = fechaSeleccionada === date
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => { setFechaSeleccionada(date); onChange({ fecha: date, hora: '', jornada: '' }) }}
                  className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-extrabold transition-all ${
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 line-through opacity-70'
                      : isSelected
                        ? 'border-green-500 bg-green-600 text-white shadow-[0_4px_12px_rgb(0,102,51,0.2)]'
                        : 'border-green-600/15 bg-white text-green-700 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <span className="block capitalize">{getDayName(date)}</span>
                  <span className="block text-[10px] opacity-75">{date.slice(5)}</span>
                  {disabled && <span className="block text-[9px] font-bold uppercase">No habil</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Horario operativo de atencion: 08:00 AM - 04:30 PM. Ultimo bloque reservable: 04:00 PM - 04:30 PM.
            Receso sin atencion: 12:00 PM - 02:00 PM.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </motion.div>
          )}

          {!loading && error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {!loading && !error && fechaSeleccionada && dayMeta?.diaNoLaborable && (
            <motion.div key="nolaborable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
              {formatFechaLabel(fechaSeleccionada)} no es un dia laborable ({dayMeta.motivo}). Selecciona otro dia.
            </motion.div>
          )}

          {!loading && !error && fechaSeleccionada && laborable && !dayMeta?.diaNoLaborable && disponibilidad.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center text-xs font-bold text-slate-400">
              No hay franjas disponibles para esta fecha
            </motion.p>
          )}

          {!loading && !error && fechaSeleccionada && disponibilidad.length > 0 && (
            <motion.div key={fechaSeleccionada} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-500 capitalize">{formatFechaLabel(fechaSeleccionada)}</p>
                {esHoy && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">Hoy</span>}
              </div>

              <JornadaSection
                icon={<Sun className="h-3.5 w-3.5" />}
                label="Manana"
                sublabel="08:00 AM - 11:00 AM"
                slots={manana}
                selectedHora={selectedHora}
                onSelect={handleSelectSlot}
                esHoy={esHoy}
              />

              <JornadaSection
                icon={<Sunset className="h-3.5 w-3.5" />}
                label="Tarde"
                sublabel="02:00 PM - 04:30 PM"
                slots={tarde}
                selectedHora={selectedHora}
                onSelect={handleSelectSlot}
                esHoy={esHoy}
              />

              {manana.length === 0 && tarde.length === 0 && (
                <motion.p className="py-3 text-center text-xs font-bold text-slate-400">Sin bloques disponibles este dia.</motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function JornadaSection({ icon, label, sublabel, slots, selectedHora, onSelect, esHoy }) {
  if (slots.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-green-700">
        {icon}
        <span className="text-xs font-extrabold">{label}</span>
        <span className="text-[10px] font-bold text-slate-400">{sublabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => {
          const isSelected = selectedHora === slot.hora
          const agotado = slot.bloqueado || slot.libres <= 0
          const pasado = esHoy && isPastSlot(slot.hora)
          const disabled = agotado || pasado
          return (
            <button
              key={slot.hora}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(slot.hora, slot.jornada)}
              className={`group relative min-w-0 cursor-pointer rounded-xl border px-3 py-2 text-left transition-all ${
                disabled
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 opacity-60'
                  : isSelected
                    ? 'border-green-500 bg-green-600 text-white shadow-[0_4px_12px_rgb(0,102,51,0.2)]'
                    : 'border-green-600/15 bg-white text-green-800 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <span className={`block truncate text-[11px] font-extrabold ${disabled ? 'text-slate-400' : ''}`}>{slot.hora}</span>
              <span className={`mt-0.5 block text-[10px] font-bold ${disabled ? 'text-slate-400' : isSelected ? 'text-green-100' : 'text-slate-400'}`}>
                {pasado && !agotado ? 'Turno finalizado' : agotado ? 'Sin cupos' : `${slot.libres} cupo${slot.libres !== 1 ? 's' : ''} / ${slot.capacidad}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}