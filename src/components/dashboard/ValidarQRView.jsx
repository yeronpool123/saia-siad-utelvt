import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowLeft, BadgeCheck, Calendar, Camera, CheckCircle2, FileSearch, HardHat, Image as ImageIcon, Loader2, QrCode, ScanLine, User } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../../lib/api'
import { ROL_LABEL } from '../../lib/institucional'

const READER_ID = 'validar-qr-reader'

function formatFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ValidarQRView({ onBack, onAtendido }) {
  const scannerRef = useRef(null)
  const [estadoCamara, setEstadoCamara] = useState('apagada')
  const [escaneando, setEscaneando] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [resultado, setResultado] = useState(null)
  const [fallo, setFallo] = useState(null)
  const imageInputRef = useRef(null)

  const detenerCamara = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch {
        // El escaner pudo no haber iniciado
      }
      scannerRef.current = null
      setEstadoCamara('apagada')
    }
    setEscaneando(false)
  }

  useEffect(() => {
    return () => { detenerCamara() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const iniciarCamara = async () => {
    setErrorGlobal('')
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        setErrorGlobal('No se detecto ninguna camara disponible.')
        return
      }
      scannerRef.current = new Html5Qrcode(READER_ID)
      setEstadoCamara('iniciando')
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (texto) => verificar(texto),
        () => {}
      )
      setEstadoCamara('activa')
      setEscaneando(true)
    } catch (err) {
      setEstadoCamara('apagada')
      setErrorGlobal(err?.message || 'No se pudo iniciar la camara. Verifica los permisos del navegador.')
    }
  }

  const escanearImagen = async (file) => {
    if (!file) return
    setErrorGlobal('')
    setVerificando(true)
    try {
      if (scannerRef.current) await detenerCamara()
      const qr = new Html5Qrcode(READER_ID)
      const texto = await qr.scanFile(file, false)
      await verificar(texto)
    } catch {
      setFallo({ titulo: 'Codigo no reconocido', mensaje: 'No se pudo leer un codigo QR valido en la imagen seleccionada.' })
    } finally {
      setVerificando(false)
    }
  }

  const verificar = async (payload) => {
    if (!payload || verificando) return
    setVerificando(true)
    setErrorGlobal('')
    setResultado(null)
    setFallo(null)
    try {
      const res = await api.post('/tickets/verify-qr', { payload })
      setResultado(res.data.data)
      await detenerCamara()
      onAtendido?.(res.data.data)
    } catch (err) {
      setFallo({
        titulo: 'Codigo invalido',
        mensaje: err.response?.data?.message || err.message || 'Error al verificar el codigo QR.',
        codigo: err.response?.data?.code,
        data: err.response?.data?.data,
      })
    } finally {
      setVerificando(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-10" aria-labelledby="validar-qr-title">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-green-600/15 bg-white text-green-700 transition-colors hover:bg-green-50"
          aria-label="Volver al panel"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div>
          <p className="text-caption text-green-700">Control de acceso</p>
          <h2 id="validar-qr-title" className="text-h2 text-grad-animate">Escaner de Ticket QR</h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        <div className="glass-card rounded-3xl p-6">
          <div id={READER_ID} className={`overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${estadoCamara === 'activa' ? 'border-green-400' : 'border-green-600/20'}`} />

          {estadoCamara === 'apagada' && !verificando && (
            <div className="-mt-1 flex flex-col items-center gap-2 rounded-2xl border border-green-600/10 bg-green-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white">
                <QrCode className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="mt-2 text-sm font-extrabold text-green-900">Escanea el ticket en ventanilla</p>
              <p className="text-xs font-bold leading-5 text-slate-500">
                Enciende la camara o selecciona una imagen con el codigo QR. Al validarse, el ticket pasa a estado ATENDIDO.
              </p>
            </div>
          )}

          {estadoCamara === 'iniciando' && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-green-700">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Iniciando camara...
            </div>
          )}

          {verificando && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-green-700">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Verificando ticket...
            </div>
          )}

          {errorGlobal && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {errorGlobal}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {estadoCamara === 'activa' || estadoCamara === 'iniciando' ? (
              <button
                onClick={detenerCamara}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition-colors hover:bg-red-100"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Apagar Camara
              </button>
            ) : (
              <button
                onClick={iniciarCamara}
                disabled={verificando}
                className="btn-primary flex flex-1 items-center justify-center gap-2"
              >
                <Camera className="relative z-10 h-4 w-4" aria-hidden="true" />
                <span className="relative z-10">Encender Camara</span>
              </button>
            )}

            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={verificando}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-600/15 bg-white px-5 text-sm font-extrabold text-green-700 transition-colors hover:bg-green-50"
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Escanear desde Imagen
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => { const f = event.target.files?.[0]; if (f) escanearImagen(f); event.target.value = '' }}
            />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <p className="text-caption mb-3 flex items-center gap-2 text-green-700">
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            Como funciona
          </p>
          <ol className="space-y-3 text-xs font-bold leading-5 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-black text-green-700">1</span>
              El ticket digital se genera al asignar un especialista.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-black text-green-700">2</span>
              El codigo QR incluye el numero de ticket, cedula y una firma de seguridad.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-black text-green-700">3</span>
              Al validarse, el ticket pasa a ATENDIDO y la cita a COMPLETADA.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-black text-green-700">4</span>
              Un ticket ya atendido no puede volver a escanearse.
            </li>
          </ol>
        </div>
      </div>

      <AnimatePresence>
        {resultado && (
          <motion.div
            key="exito"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-3xl border border-green-200 bg-white p-6 shadow-[0_24px_48px_rgb(0,102,51,0.10)]"
            role="status"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
                <BadgeCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-h3">Ticket Atendido Correctamente</p>
                <p className="text-xs font-bold text-green-700">{resultado.atendidoEnLocal}</p>
              </div>
              <span className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">{resultado.numero}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoChip icon={User} label="Solicitante" value={[resultado.usuario?.nombre, resultado.usuario?.apellido].filter(Boolean).join(' ') || '-'} />
              <InfoChip icon={FileSearch} label="Cedula" value={resultado.usuario?.cedula || '-'} />
              <InfoChip icon={HardHat} label="Especialista" value={resultado.especialista || 'No asignado'} />
              <InfoChip icon={Calendar} label="Cita" value={resultado.fechaCita ? `${formatFecha(resultado.fechaCita)} · ${resultado.horaCita || ''}` : 'Sin cita'} />
              <InfoChip icon={User} label="Ubicacion academica" value={[ROL_LABEL[resultado.usuario?.rol], resultado.usuario?.facultad, resultado.usuario?.carrera].filter(Boolean).join(' · ') || '-'} className="sm:col-span-2" />
            </div>
            <button
              onClick={() => setResultado(null)}
              className="btn-primary mt-5 flex w-full items-center justify-center gap-2"
            >
              <CheckCircle2 className="relative z-10 h-4 w-4" aria-hidden="true" />
              <span className="relative z-10">Listo para el siguiente ticket</span>
            </button>
          </motion.div>
        )}

        {fallo && (
          <motion.div
            key="fallo"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 rounded-3xl border p-6 shadow-[0_24px_48px_rgba(0,0,0,0.08)] ${fallo.codigo === 'TICKET_YA_ATENDIDO' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${fallo.codigo === 'TICKET_YA_ATENDIDO' ? 'bg-amber-500' : 'bg-red-600'}`}>
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-h3">{fallo.codigo === 'TICKET_YA_ATENDIDO' ? 'Ticket ya atendido' : fallo.titulo}</p>
                <p className="text-xs font-bold text-slate-600">{fallo.mensaje}</p>
              </div>
            </div>
            {fallo.data?.numero && (
              <p className="mt-4 rounded-xl border border-current/10 bg-white/60 px-4 py-3 text-xs font-bold text-slate-700">
                Ticket {fallo.data.numero} · estado {fallo.data.estado}{fallo.data.atendidoEnLocal ? ` · atendido el ${fallo.data.atendidoEnLocal}` : ''}
              </p>
            )}
            <button
              onClick={() => setFallo(null)}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-600/15 bg-white px-5 py-3 text-sm font-extrabold text-green-700 transition-colors hover:bg-green-50"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function InfoChip({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-green-600/10 bg-green-50/50 p-3 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-sm font-extrabold text-ink">{value}</p>
      </div>
    </div>
  )
}