import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Camera, Loader2, Lock, LogIn, Mail, ScanFace, X } from 'lucide-react'
import SaiaLogo from '../brand/SaiaLogo'
import AnimatedPointer from '../animations/AnimatedPointer'
import { SCALE_TAP } from '../../lib/motion'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-bold text-green-800'

const FACE_VIDEO_CONSTRAINTS = {
  audio: false,
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
}

export default function Login({ onLogin, onFaceLogin, onBack, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [faceOpen, setFaceOpen] = useState(false)
  const [faceLoading, setFaceLoading] = useState(false)
  const [faceError, setFaceError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [camaras, setCamaras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')

  const listarCamaras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter((d) => d.kind === 'videoinput')
      if (cams.length > 0) setCamaras(cams)
      return cams
    } catch {
      return []
    }
  }

  useEffect(() => {
    if (!faceOpen) return undefined
    let cancelled = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(FACE_VIDEO_CONSTRAINTS)
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        await listarCamaras()
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        if (!cancelled) setFaceError('No se pudo acceder a la camara. Verifica los permisos del navegador.')
      }
    }

    startCamera()
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [faceOpen])

  const openFaceLogin = () => {
    setFaceError('')
    setFaceOpen(true)
  }

  const cambiarCamara = async (deviceId) => {
    setSelectedCamera(deviceId)
    setFaceError('')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: { exact: deviceId } } : FACE_VIDEO_CONSTRAINTS.video,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      await listarCamaras()
    } catch {
      setFaceError('No se pudo acceder a la camara seleccionada. Verifica los permisos del navegador.')
    }
  }

  const closeFaceLogin = () => {
    setFaceOpen(false)
    setFaceLoading(false)
    setFaceError('')
    setSelectedCamera('')
    setCamaras([])
  }

  const captureFace = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setFaceError('La camara aun no esta lista. Intenta de nuevo.')
      return
    }
    const canvas = document.createElement('canvas')
    const maxDim = 400
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    setFaceLoading(true)
    setFaceError('')
    try {
      await onFaceLogin(canvas.toDataURL('image/jpeg', 0.7))
    } catch (err) {
      setFaceError(err.message || 'Error al verificar el rostro.')
    } finally {
      setFaceLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ingresa un correo electronico valido.')
      return
    }
    if (!password) {
      setError('La contrasena es obligatoria.')
      return
    }

    setLoading(true)
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md" aria-labelledby="login-title">
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <button onClick={onBack} className="mb-7 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-green-700 transition-colors hover:text-green-500">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>

        <header className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <SaiaLogo compact />
          </div>
          <p className="text-caption mb-2 text-green-700">Acceso institucional</p>
          <h2 id="login-title" className="text-h2 text-grad-animate">Iniciar Sesion</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Ingresa tus credenciales para acceder al portal.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="relative">
            <AnimatedPointer label="Ingresa tu correo aqui" className="-right-36 top-3" flip />
            <label htmlFor="login-email" className={labelClass}>
              <Mail className="h-4 w-4 text-green-600" aria-hidden="true" />
              Correo Electronico
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@utelvt.edu.ec"
              required
              autoComplete="email"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="login-password" className={labelClass}>
              <Lock className="h-4 w-4 text-green-600" aria-hidden="true" />
              Contrasena
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              autoComplete="current-password"
              className="field"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" aria-hidden="true" />
              {error}
            </p>
          )}

          <motion.button type="submit" disabled={loading} {...SCALE_TAP} className="btn-primary flex w-full items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="relative z-10 h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="relative z-10">Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="relative z-10 h-5 w-5" aria-hidden="true" />
                <span className="relative z-10">Ingresar</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="my-6 flex items-center gap-3" role="separator" aria-label="O iniciar con Face ID">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-caption text-slate-400">o</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <motion.button
          type="button"
          onClick={openFaceLogin}
          disabled={faceLoading}
          {...SCALE_TAP}
          className="btn-ghost flex w-full items-center justify-center gap-2"
        >
          <ScanFace className="h-5 w-5" aria-hidden="true" />
          Iniciar sesion con Face ID
        </motion.button>

        <p className="mt-6 text-center text-sm font-semibold text-slate-600">
          No tienes cuenta?{' '}
          <button onClick={onGoRegister} className="cursor-pointer font-extrabold text-green-700 transition-colors hover:text-green-500">
            Crear Cuenta
          </button>
        </p>
      </div>

      <AnimatePresence>
        {faceOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFaceLogin}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="face-login-title"
              className="glass-card relative w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8"
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 16, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={closeFaceLogin}
                aria-label="Cerrar"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-900/30 text-white transition-colors hover:bg-slate-900/50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <header className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <ScanFace className="h-8 w-8 text-green-700" aria-hidden="true" />
                </div>
                <h3 id="face-login-title" className="text-h3 text-grad-animate">Verificacion Facial</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Coloca tu rostro dentro del ovalo y presiona capturar.
                </p>
              </header>

              <div className="mb-3 flex items-center gap-2">
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-green-700">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Camara
                </span>
                <select
                  aria-label="Selector de camara"
                  value={selectedCamera}
                  onChange={(event) => cambiarCamara(event.target.value)}
                  disabled={camaras.length === 0}
                  className="field min-h-10 cursor-pointer flex-1"
                >
                  <option value="">Camara por defecto</option>
                  {camaras.map((cam, index) => (
                    <option key={cam.deviceId || `cam-${index}`} value={cam.deviceId}>
                      {cam.label?.trim() || `Camara ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="h-3/5 w-3/5 rounded-full border-[3px] border-green-400/90 shadow-[0_0_24px_rgba(74,222,128,0.45)]" aria-hidden="true" />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent pb-3 pt-8 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-300">
                    <Camera className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    Alinea tu rostro con el ovalo
                  </p>
                </div>
              </div>

              {faceError && (
                <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" aria-hidden="true" />
                  {faceError}
                </p>
              )}

              <motion.button
                type="button"
                onClick={captureFace}
                disabled={faceLoading}
                {...SCALE_TAP}
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                {faceLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Verificando rostro...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" aria-hidden="true" />
                    Capturar Rostro
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
