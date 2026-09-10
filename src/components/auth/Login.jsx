import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Loader2, Lock, LogIn, Mail } from 'lucide-react'
import SaiaLogo from '../brand/SaiaLogo'
import AnimatedPointer from '../animations/AnimatedPointer'
import { SCALE_TAP } from '../../lib/motion'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-bold text-green-800'

export default function Login({ onLogin, onBack, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

        <p className="mt-6 text-center text-sm font-semibold text-slate-600">
          No tienes cuenta?{' '}
          <button onClick={onGoRegister} className="cursor-pointer font-extrabold text-green-700 transition-colors hover:text-green-500">
            Crear Cuenta
          </button>
        </p>
      </div>
    </section>
  )
}
