import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WelcomePanel from './components/auth/WelcomePanel'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import AdminDashboard from './components/dashboard/AdminDashboard'
import IngenierosModal from './components/dashboard/IngenierosModal'
import TicketComprobanteModal from './components/dashboard/TicketComprobanteModal'
import { api } from './lib/api'
import { useLenis } from './hooks/useLenis'
import { EASE_OUT } from './lib/motion'

const ParticlesBackground = lazy(() => import('./components/animations/ParticlesBackground'))

const AUTH_VIEWS = {
  WELCOME: 'welcome',
  LOGIN: 'login',
  REGISTER: 'register',
}

const ADMIN_ROLES = ['SOPORTE_TI', 'SUPER_ADMIN']

const pageTransition = {
  initial: { opacity: 0, y: 16, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, filter: 'blur(3px)', transition: { duration: 0.25 } },
}

export default function App() {
  useLenis()

  const [authView, setAuthView] = useState(AUTH_VIEWS.WELCOME)
  const [currentUser, setCurrentUser] = useState(null)
  const [interceptPayload, setInterceptPayload] = useState(null)
  const [ingenierosOpen, setIngenierosOpen] = useState(false)
  const [comprobanteOpen, setComprobanteOpen] = useState(false)
  const [ticketDigital, setTicketDigital] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('refreshToken')
      }
    }
  }, [])

  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.rol)

  const handleRegister = useCallback(async (userData) => {
    const response = await api.post('/auth/register', {
      nombre: userData.nombres,
      apellido: userData.apellidos,
      email: userData.email,
      password: userData.password,
      cedula: userData.cedula,
      rol: userData.rol,
      facultad: userData.facultad,
      carrera: userData.carrera,
      cargo: userData.cargo,
    })
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    setCurrentUser(response.data.user)
  }, [])

  const handleLogin = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    setCurrentUser(response.data.user)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setCurrentUser(null)
    setAuthView(AUTH_VIEWS.WELCOME)
  }, [])

  const uploadCedula = async (file) => {
    const formData = new FormData()
    formData.append('foto', file)
    const uploadRes = await api.uploadFile('/upload/cedula', formData)
    return uploadRes.data.url
  }

  const handleSubmitRequest = useCallback(async (payload) => {
    const MOTIVO_TO_TIPO = {
      'reseteo-siad': 'RESETEO_SIAD',
      'correo-institucional': 'RESETEO_CORREO',
      'credenciales-siad': 'ACCESO_PLATAFORMA',
      'ambos': 'OTRO',
    }
    const MOTIVO_LABEL = {
      'reseteo-siad': 'Reseteo SIAD',
      'correo-institucional': 'Correo Institucional',
      'credenciales-siad': 'Credenciales SIAD',
      'ambos': 'Correo + SIAD',
    }

    let fotoCedulaUrl = ''
    if (payload.archivoCedula) {
      fotoCedulaUrl = await uploadCedula(payload.archivoCedula)
    }

    const response = await api.post('/tickets', {
      titulo: `Solicitud de ${MOTIVO_LABEL[payload.motivoSolicitud] || payload.motivoSolicitud} - ${payload.programaAcademico}`,
      descripcion: payload.descripcion,
      tipo: MOTIVO_TO_TIPO[payload.motivoSolicitud] || 'OTRO',
      cedula: payload.cedulaIdentidad || '',
      fotoCedulaUrl,
      metadata: {
        cedula: payload.cedulaIdentidad || '',
        rol: payload.rolUsuario,
        facultad: payload.facultad,
        facultadNombre: payload.facultadNombre,
        carrera: payload.carrera,
        cargo: payload.cargo,
      },
    })

    return { ticketId: response.data.numero }
  }, [])

  const handleInterceptSubmit = useCallback((payload) => {
    setInterceptPayload(payload)
    setIngenierosOpen(true)
  }, [])

  const handleIngenierosClose = useCallback(() => {
    setIngenierosOpen(false)
    setInterceptPayload(null)
  }, [])

  const handleIngenierosSuccess = useCallback((ticketData) => {
    setIngenierosOpen(false)
    setInterceptPayload(null)
    setTicketDigital(ticketData)
    setComprobanteOpen(true)
  }, [])

  const handleComprobanteClose = useCallback(() => {
    setComprobanteOpen(false)
    setTicketDigital(null)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-var(--grad-hero) text-ink">
      <Suspense fallback={null}>
        <ParticlesBackground />
      </Suspense>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 right-6rem h-72 w-72 rounded-full bg-green-400/10 blur-[80px] lg:h-96 lg:w-96" />
        <div className="absolute bottom-8rem left-6rem h-72 w-72 rounded-full bg-green-600/10 blur-[72px] lg:h-96 lg:w-96" />
      </div>

      <main className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {currentUser ? (
            <motion.div key="dashboard" {...pageTransition} className="w-full">
              {isAdmin ? (
                <AdminDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Dashboard
                  user={currentUser}
                  onSubmitRequest={handleSubmitRequest}
                  onInterceptSubmit={handleInterceptSubmit}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          ) : (
            <motion.div key={authView} {...pageTransition} className="flex min-h-[calc(100vh-3rem)] w-full items-center">
              {authView === AUTH_VIEWS.WELCOME && (
                <WelcomePanel
                  onLogin={() => setAuthView(AUTH_VIEWS.LOGIN)}
                  onRegister={() => setAuthView(AUTH_VIEWS.REGISTER)}
                />
              )}
              {authView === AUTH_VIEWS.LOGIN && (
                <Login
                  onLogin={handleLogin}
                  onBack={() => setAuthView(AUTH_VIEWS.WELCOME)}
                  onGoRegister={() => setAuthView(AUTH_VIEWS.REGISTER)}
                />
              )}
              {authView === AUTH_VIEWS.REGISTER && (
                <Register
                  onRegister={handleRegister}
                  onBack={() => setAuthView(AUTH_VIEWS.WELCOME)}
                  onGoLogin={() => setAuthView(AUTH_VIEWS.LOGIN)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <IngenierosModal
        open={ingenierosOpen}
        onClose={handleIngenierosClose}
        formPayload={interceptPayload}
        onSuccess={handleIngenierosSuccess}
      />

      <TicketComprobanteModal
        open={comprobanteOpen}
        onClose={handleComprobanteClose}
        ticket={ticketDigital}
      />
    </div>
  )
}
