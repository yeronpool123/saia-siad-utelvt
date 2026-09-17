import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowLeft, BadgeCheck, Camera, Clock, Image as ImageIcon, Loader2, LogIn, QrCode, ScanLine } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../../lib/api'
import { ROL_LABEL } from '../../lib/institucional'

const READER_ID = 'validar-qr-reader'

function formatFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}

const RE_PAYLOAD = /(?:PAYLOAD|CODIGO|TOKEN)\s*[:=]\s*([A-Za-z0-9_\-]+\.[A-Za-z0-9]+)/i
const RE_TICKET = /TICKET:\s*(TKT-\d{4}-\d+)/i

function parsearQR(texto) {
  const limpio = String(texto || '').trim()
  if (!limpio) return { tipo: 'invalido' }

  const payloadMatch = limpio.match(RE_PAYLOAD)
  if (payloadMatch) return { tipo: 'payload', valor: payloadMatch[1] }

  const ticketMatch = limpio.match(RE_TICKET)
  if (ticketMatch) return { tipo: 'codigo', valor: ticketMatch[1] }

  if (/^TKT-\d{4}-\d+$/i.test(limpio)) return { tipo: 'codigo', valor: limpio }

  if (limpio.includes('.') && !/\s/.test(limpio)) return { tipo: 'payload', valor: limpio }

  return { tipo: 'invalido' }
}

export default function ValidarQRView({ onBack, onAtendido, onLogout }) {
  const scannerRef = useRef(null)
  const [estadoCamara, setEstadoCamara] = useState('apagada')
  const [escaneando, setEscaneando] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [resultado, setResultado] = useState(null)
  const [fallo, setFallo] = useState(null)
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const imageInputRef = useRef(null)
  const [camaras, setCamaras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [isChangingCamera, setIsChangingCamera] = useState(false)

  const detenerCamara = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current
      try {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {})
        }
        await scanner.clear().catch(() => {})
      } catch {
        // El escaner pudo no haber iniciado o ya fue detenido
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

  const arrancarScanner = async (deviceId) => {
    setErrorGlobal('')
    scannerRef.current = new Html5Qrcode(READER_ID)
    setEstadoCamara('iniciando')
    const cameraConfig = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
    try {
      await scannerRef.current.start(
        cameraConfig,
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(viewfinderWidth * 0.8),
            height: Math.floor(viewfinderHeight * 0.8),
          }),
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (texto) => {
          if (!texto) return
          console.log('[QR] Detectado:', texto)
          setVerificando(true)
          verificar(texto)
        },
        () => {}
      )
      setEstadoCamara('activa')
      setEscaneando(true)
    } catch (err) {
      console.warn('Error controlado al iniciar camara:', err)
      setEstadoCamara('apagada')
      setEscaneando(false)
      scannerRef.current = null
      setErrorGlobal(err?.message || 'No se pudo iniciar la camara. Verifica los permisos del navegador.')
    }
  }

  const iniciarCamara = async () => {
    setErrorGlobal('')
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        setErrorGlobal('No se detecto ninguna camara disponible.')
        return
      }
      setCamaras(devices)
      await arrancarScanner('')
    } catch (err) {
      setEstadoCamara('apagada')
      setEscaneando(false)
      scannerRef.current = null
      setErrorGlobal(err?.message || 'No se pudo iniciar la camara. Verifica los permisos del navegador.')
    }
  }

  const cambiarCamara = async (deviceId) => {
    if (isChangingCamera || estadoCamara === 'iniciando' || !scannerRef.current) return
    setIsChangingCamera(true)
    try {
      setSelectedCamera(deviceId)
      await detenerCamara()
      await new Promise((resolve) => requestAnimationFrame(() => resolve()))
      await new Promise((resolve) => setTimeout(resolve, 150))
      await arrancarScanner(deviceId)
    } finally {
      setIsChangingCamera(false)
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
      const parsed = parsearQR(payload)
      let res

      if (parsed.tipo === 'payload') {
        res = await api.post('/tickets/verify-qr', { payload: parsed.valor })
      } else if (parsed.tipo === 'codigo') {
        res = await api.put(`/tickets/${encodeURIComponent(parsed.valor)}/validar`)
      } else {
        throw new Error('El código QR no contiene un ticket reconocible.')
      }

      const validado = res.data
      setResultado(validado)
      await detenerCamara()
      onAtendido?.(validado)
    } catch (err) {
      const apiErr = err.response?.data
      const status = err.response?.status

      if (status === 401) {
        setSesionExpirada(true)
        setFallo(null)
        await detenerCamara()
        return
      }

      if (status === 400) {
        setFallo({
          titulo: 'Codigo no reconocido',
          mensaje: apiErr?.message || 'El codigo QR no corresponde a un ticket valido o su formato es incorrecto.',
          codigo: apiErr?.code,
          data: apiErr?.data,
        })
        return
      }

      if (status === 404) {
        setFallo({
          titulo: 'Ticket no encontrado',
          mensaje: 'El ticket indicado no existe o no esta registrado en el sistema.',
          codigo: apiErr?.code,
          data: apiErr?.data,
        })
        return
      }

      setFallo({
        titulo: apiErr?.code === 'TICKET_YA_ATENDIDO' ? 'Ticket ya atendido' : 'Codigo invalido',
        mensaje: apiErr?.message || err.message || 'Error al verificar el código QR.',
        codigo: apiErr?.code,
        data: apiErr?.data,
      })
    } finally {
      setVerificando(false)
    }
  }

  const resetEscaneo = () => {
    setResultado(null)
    setFallo(null)
    setErrorGlobal('')
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
          {estadoCamara !== 'apagada' && camaras.length > 0 && (
            <div id="camara-selector" className="mb-3 flex items-center gap-2">
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-green-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Camara
              </span>
              <select
                aria-label="Selector de camara"
                value={selectedCamera}
                onChange={(event) => cambiarCamara(event.target.value)}
                disabled={isChangingCamera || estadoCamara === 'iniciando' || verificando}
                className="field min-h-10 cursor-pointer flex-1"
              >
                <option value="">Camara por defecto</option>
                {camaras.map((cam, index) => (
                  <option key={cam.id || `cam-${index}`} value={cam.id}>
                    {cam.label?.trim() || `Camara ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            key="modal-exito"
            role="dialog"
            aria-modal="true"
            aria-labelledby="validacion-exitosa-titulo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)] sm:p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.15, 1] }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-inner"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/30">
                  <BadgeCheck className="h-11 w-11" aria-hidden="true" />
                </span>
              </motion.div>

              <h2 id="validacion-exitosa-titulo" className="mb-2 text-center text-3xl font-black text-slate-800">
                ¡Validación Exitosa!
              </h2>
              <p className="mb-6 text-center text-sm font-medium text-slate-500">
                El ticket ha sido procesado y sincronizado en tiempo real.
              </p>

              <div className="mb-6 space-y-4 rounded-2xl border border-green-100 bg-slate-50 p-4 text-left">
                <DatoModal label="Ticket" value={resultado.numero || '-'} highlight />
                <DatoModal label="Solicitante" value={[resultado.usuario?.nombre, resultado.usuario?.apellido].filter(Boolean).join(' ') || '-'} />
                <DatoModal label="Cédula" value={resultado.usuario?.cedula || '-'} />
                <DatoModal label="Especialista" value={resultado.especialista || 'No asignado'} />
                <DatoModal
                  label="Fecha de cita"
                  value={resultado.fechaCita ? `${formatFecha(resultado.fechaCita)}${resultado.horaCita ? ` · ${resultado.horaCita}` : ''}` : 'Sin cita'}
                />
                <DatoModal
                  label="Ubicacion academica"
                  value={[ROL_LABEL[resultado.usuario?.rol], resultado.usuario?.facultad, resultado.usuario?.carrera].filter(Boolean).join(' · ') || '-'}
                />
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold leading-5 text-amber-800">
                  Este ticket cambió su estado a <strong>ATENDIDO</strong> en el sistema. Ya no puede volver a escanearse.
                  El dashboard principal se ha actualizado automáticamente.
                </p>
              </div>

              <button
                onClick={resetEscaneo}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-green-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Aceptar y Escanear Otro
              </button>
            </motion.div>
          </motion.div>
        )}

        {fallo && (
          <motion.div
            key="fallo"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 rounded-3xl border p-6 shadow-[0_24px_48px_rgba(0,0,0,0.08)] ${fallo.codigo === 'TICKET_YA_ATENDIDO' ? 'border-red-300 bg-white' : 'border-red-200 bg-red-50'}`}
            role="alert"
          >
            {fallo.codigo === 'TICKET_YA_ATENDIDO' ? (
              <>
                <div className="rounded-2xl border-2 border-red-600 bg-red-600 px-4 py-4 text-center shadow-[0_8px_24px_rgba(220,38,38,0.25)]">
                  <p className="text-sm font-black uppercase tracking-wide text-white sm:text-base">
                    ❌ TICKET INVÁLIDO - YA FUE ATENDIDO EL {fallo.data?.atendidoEnLocal || fallo.mensaje}
                  </p>
                </div>
                {fallo.data?.numero && (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-extrabold text-red-800">
                    Ticket {fallo.data.numero} · estado {fallo.data.estado} · inhabilitado: no puede volver a escanearse ni reutilizarse.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                    <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-h3">{fallo.titulo}</p>
                    <p className="text-xs font-bold text-slate-600">{fallo.mensaje}</p>
                  </div>
                </div>
                {fallo.data?.numero && (
                  <p className="mt-4 rounded-xl border border-current/10 bg-white/60 px-4 py-3 text-xs font-bold text-slate-700">
                    Ticket {fallo.data.numero} · estado {fallo.data.estado}{fallo.data.atendidoEnLocal ? ` · atendido el ${fallo.data.atendidoEnLocal}` : ''}
                  </p>
                )}
              </>
            )}
            <button
              onClick={() => setFallo(null)}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-600/15 bg-white px-5 py-3 text-sm font-extrabold text-green-700 transition-colors hover:bg-green-50"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        )}

        {sesionExpirada && (
          <motion.div
            key="sesion-expirada"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sesion-expirada-titulo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-6 text-center shadow-[0_40px_90px_rgba(0,0,0,0.5)] sm:p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.15, 1] }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 shadow-inner"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30">
                  <Clock className="h-8 w-8" aria-hidden="true" />
                </span>
              </motion.div>

              <h2 id="sesion-expirada-titulo" className="mb-2 text-2xl font-black text-slate-800">Sesion expirada</h2>
              <p className="mb-6 text-sm font-medium leading-5 text-slate-500">
                Tu sesion ha expirado. Por favor vuelve a iniciar sesion para continuar usando el sistema.
              </p>

              <button
                onClick={() => { setSesionExpirada(false); onLogout?.() }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-green-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Volver a iniciar sesion
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function DatoModal({ label, value, highlight = false }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`mt-0.5 block font-extrabold ${highlight ? 'text-lg text-green-700' : 'text-sm text-slate-800'}`}>{value || '-'}</span>
    </div>
  )
}