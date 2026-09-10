import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Eye,
  FileDown,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  QrCode,
  RefreshCcw,
  ScanLine,
  Search,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { io } from 'socket.io-client'
import SaiaLogo from '../brand/SaiaLogo'
import SpotlightCard from '../ui/SpotlightCard'
import ValidarQRView from './ValidarQRView'
import { api } from '../../lib/api'
import { socketUrl, ROL_LABEL } from '../../lib/institucional'
import { SPRING } from '../../lib/motion'

const FOTO_PATHS = {
  'hector-sacon': '/fotos/hector-sacon.jpg',
  'luis-montano': '/fotos/luis-montano.jpg',
  'yeron-pool': '/fotos/yeron-pool.jpg',
}

const ESTADO_META = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  EN_PROCESO: { label: 'En proceso', cls: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  ATENDIDO: { label: 'Atendido', cls: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  RESUELTO: { label: 'Resuelto', cls: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  RECHAZADO: { label: 'Rechazado', cls: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  CERRADO: { label: 'Cerrado', cls: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  ESPERANDO_RESPUESTA: { label: 'En espera', cls: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
}

const ESTADO_LABEL = (estado) => ESTADO_META[estado]?.label || estado?.replace(/_/g, ' ') || '—'

function getGreetingName(nombre = '', apellido = '') {
  const first = nombre.trim().split(/\s+/).filter(Boolean)[0] || ''
  const last = apellido.trim().split(/\s+/).filter(Boolean)[0] || ''
  return [first, last].filter(Boolean).join(' ') || 'Administrador'
}

const formatFecha = (fecha) => (fecha ? new Date(fecha).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const formatDia = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' }) : '—')

export default function AdminDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [buscar, setBuscar] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedEngineer, setSelectedEngineer] = useState(null)
  const [engineerTickets, setEngineerTickets] = useState([])
  const [engineerLoading, setEngineerLoading] = useState(false)
  const [view, setView] = useState('dashboard')
  const [notificacion, setNotificacion] = useState(null)
  const notifTimer = useRef(null)

  const greeting = getGreetingName(user.nombre, user.apellido)

  const notificar = useCallback((mensaje, tipo = 'ok') => {
    setNotificacion({ mensaje, tipo })
    if (notifTimer.current) clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotificacion(null), 5000)
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/dashboard')
      setDashboard(res.data)
    } catch {
      // fallo silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filtroEstado) params.set('estado', filtroEstado)
      if (buscar.trim()) params.set('buscar', buscar.trim())
      const res = await api.get(`/admin/tickets?${params.toString()}`)
      setTickets(res.data.data || [])
    } catch {
      setTickets([])
    } finally {
      setTicketsLoading(false)
    }
  }, [filtroEstado, buscar])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  useEffect(() => {
    const delay = setTimeout(() => fetchTickets(), 250)
    return () => clearTimeout(delay)
  }, [fetchTickets])

  useEffect(() => {
    const onHashChange = () => setView(window.location.hash === '#/admin/validar-qr' ? 'scanner' : 'dashboard')
    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const socket = io(socketUrl(), { transports: ['websocket'] })
    const onRefresh = (payload) => {
      fetchDashboard()
      if (!selectedEngineer) fetchTickets()
      notificar(`Nueva actividad: ticket ${payload?.numero ? `#${payload.numero}` : 'actualizado'}`)
    }
    const onAtendido = (payload) => {
      fetchDashboard()
      if (!selectedEngineer) fetchTickets()
      notificar(`Ticket ${payload?.numero ? `#${payload.numero}` : ''} atendido en ventanilla`, 'ok')
    }
    socket.on('dashboard:refresh', onRefresh)
    socket.on('ticket:atendido', onAtendido)
    return () => { socket.disconnect() }
  }, [fetchDashboard, fetchTickets, selectedEngineer, notificar])

  const handleAtendidoDesdeQr = useCallback((resultado) => {
    fetchDashboard()
    fetchTickets()
    notificar(`Ticket ${resultado?.numero || ''} atendido correctamente`, 'ok')
  }, [fetchDashboard, fetchTickets, notificar])

  const handleSelectEngineer = async (ingenieroId) => {
    setSelectedEngineer(ingenieroId)
    setEngineerLoading(true)
    try {
      const res = await api.get(`/admin/tickets/ingeniero/${ingenieroId}`)
      setEngineerTickets(res.data.tickets)
    } catch {
      setEngineerTickets([])
    } finally {
      setEngineerLoading(false)
    }
  }

  const handleRefresh = useCallback(() => {
    if (selectedEngineer) handleSelectEngineer(selectedEngineer)
    else { fetchDashboard(); fetchTickets() }
  }, [selectedEngineer, fetchDashboard, fetchTickets])

  const handleBack = () => {
    setSelectedEngineer(null)
    setSelectedTicket(null)
    setEngineerTickets([])
  }

  const exportarReporte = async () => {
    try {
      setNotificacion(null)
      if (notifTimer.current) clearTimeout(notifTimer.current)
      const res = await api.get('/audit-logs?limit=10000')
      const logs = res.data.data || []
      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const filas = [
        ['ID de Transaccion / Log', 'Fecha y Hora Exacta (Timestamp)', 'Nombres y Apellidos del Usuario', 'Cedula de Identidad', 'Rol', 'Facultad y Carrera', 'Accion Realizada', 'Direccion IP', 'Dispositivo / User-Agent'],
        ...logs.map((log) => [
          log.id,
          new Date(log.createdAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'medium' }),
          log.usuario ? [log.usuario.nombre, log.usuario.apellido].filter(Boolean).join(' ') : 'Sistema',
          log.usuario?.cedula || 'N/A',
          log.usuario?.rol || 'N/A',
          [log.usuario?.facultad, log.usuario?.carrera].filter(Boolean).join(' - ') || 'N/A',
          log.accion,
          log.ipAddress || '127.0.0.1',
          log.userAgent || 'N/A'
        ]),
      ]
      const csv = filas.map((fila) => fila.map(escape).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `Reporte_Auditoria_UTELVT_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      notificar('Reporte de auditoria exportado correctamente (CSV).', 'ok')
    } catch {
      notificar('No se pudo generar el reporte de auditoria.', 'error')
    }
  }

  const resumen = dashboard?.resumen
  const kpis = useMemo(() => {
    const total = resumen?.totalTickets || 0
    const pendientes = resumen?.pendientes || 0
    const enProceso = resumen?.enProceso || 0
    const resueltos = (resumen?.atendidos || 0) + (resumen?.resueltos || 0)

    return [
      { key: 'TOTAL', label: 'Total de Tickets', valor: total, icon: ScanLine, grad: 'from-slate-700 to-slate-900', ring: 'ring-slate-200', base: 'bg-slate-50', tick: 'text-slate-800', tipo: 'sparkline', sparkData: [total * 0.4, total * 0.7, total * 0.9, total] },
      { key: 'PENDIENTE', label: 'Pendientes', valor: pendientes, icon: Clock, grad: 'from-amber-400 to-amber-500', ring: 'ring-amber-200', base: 'bg-amber-50', tick: 'text-amber-600', tipo: 'pulso' },
      { key: 'EN_PROCESO', label: 'En proceso', valor: enProceso, icon: RefreshCcw, grad: 'from-blue-400 to-blue-500', ring: 'ring-blue-200', base: 'bg-blue-50', tick: 'text-blue-600', tipo: 'progreso', porcentaje: total > 0 ? (enProceso / total) * 100 : 0 },
      { key: 'ATENDIDO_RESUELTO', label: 'Atendidos / Resueltos', valor: resueltos, icon: CheckCircle2, grad: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-200', base: 'bg-emerald-50', tick: 'text-emerald-600', tipo: 'check' },
    ]
  }, [resumen])

  if (view === 'scanner') {
    return (
      <div className="mx-auto w-full max-w-7xl pb-10">
        <AdminHeader onRefresh={handleRefresh} onLogout={onLogout} />
        <ValidarQRView onBack={() => { window.location.hash = '' }} onAtendido={handleAtendidoDesdeQr} />
        <NotificacionToast notificacion={notificacion} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <AdminHeader onRefresh={handleRefresh} onLogout={onLogout} />

      <BannerEjecutivo
        totalTickets={resumen?.totalTickets || 0}
        enProceso={resumen?.enProceso || 0}
        onEscanear={() => { window.location.hash = '#/admin/validar-qr' }}
        onReporte={exportarReporte}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      ) : selectedTicket ? (
        <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />
      ) : selectedEngineer ? (
        <IngenieroDetail
          ingenieroId={selectedEngineer}
          tickets={engineerTickets}
          loading={engineerLoading}
          onSelectTicket={setSelectedTicket}
          onBack={handleBack}
        />
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((kpi, idx) => {
              const activo = filtroEstado === kpi.key || (filtroEstado === 'ATENDIDO,RESUELTO' && kpi.key === 'ATENDIDO_RESUELTO')
              return (
                <motion.button
                  key={kpi.key}
                  onClick={() => setFiltroEstado(activo ? '' : (kpi.key === 'ATENDIDO_RESUELTO' ? 'ATENDIDO,RESUELTO' : kpi.key))}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`group cursor-pointer rounded-2xl p-4 text-left ring-1 transition-all ${activo ? `bg-white shadow-[0_12px_32px_rgb(0,102,51,0.14)] ring-2 ${kpi.ring}` : 'bg-white/60 ring-white/60 backdrop-blur-xl hover:bg-white hover:shadow-[0_12px_32px_rgb(0,102,51,0.10)]'}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white ${kpi.grad} ${activo ? 'shadow-[0_6px_16px_rgb(0,102,51,0.25)]' : ''}`}>
                      <kpi.icon className="h-5 w-5 relative z-10" aria-hidden="true" />
                      {kpi.tipo === 'pulso' && <span className="absolute inset-0 rounded-xl bg-amber-400 animate-ping opacity-75" />}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <ScanLine className="h-3 w-3" aria-hidden="true" />
                      {activo ? 'Filtrando' : 'KPI'}
                    </span>
                  </div>
                  <p className={`text-3xl font-black ${kpi.tick}`}>{kpi.valor}</p>
                  <p className="mt-1 text-xs font-extrabold text-slate-600">{kpi.label}</p>
                  
                  {kpi.tipo === 'sparkline' && (
                    <Sparkline valores={kpi.sparkData} tone="slate" />
                  )}
                  {kpi.tipo === 'progreso' && (
                    <div className="mt-3 h-1.5 w-full rounded-full bg-blue-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${kpi.porcentaje}%` }} />
                    </div>
                  )}
                  {kpi.tipo === 'check' && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completado exitosamente</span>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <SpotlightCard className="p-6">
              <div className="relative z-10">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-caption mb-1 text-green-700">Seguimiento</p>
                    <h2 className="text-h3 text-ink">Tickets del sistema</h2>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      value={buscar}
                      onChange={(event) => setBuscar(event.target.value)}
                      placeholder="Buscar por numero, titulo o cedula..."
                      className="field pl-10"
                      aria-label="Buscar tickets"
                    />
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <FiltroChip activo={!filtroEstado} onClick={() => setFiltroEstado('')} label="Todos" />
                  {Object.entries(ESTADO_META).map(([key, meta]) => (
                    <FiltroChip key={key} activo={filtroEstado === key} onClick={() => setFiltroEstado(filtroEstado === key ? '' : key)} label={meta.label} dot={meta.dot} />
                  ))}
                </div>

                <div className="-mx-2 overflow-x-auto px-2">
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-14">
                      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="py-14 text-center">
                      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-300" aria-hidden="true" />
                      <p className="text-sm font-extrabold text-slate-500">No hay tickets para este filtro</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-green-600/10 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                          <th className="px-3 py-2">Ticket</th>
                          <th className="px-3 py-2">Solicitante</th>
                          <th className="px-3 py-2">Metadatos</th>
                          <th className="px-3 py-2">Estado</th>
                          <th className="px-3 py-2">Creado</th>
                          <th className="px-3 py-2" aria-label="Ver" />
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <TicketsRow key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </SpotlightCard>

            <div className="space-y-5">
              <SpotlightCard className="p-6">
                <div className="relative z-10">
                  <p className="text-caption mb-4 flex items-center gap-2 text-green-700">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Especialistas de Soporte
                  </p>
                  <div className="space-y-3">
                    {dashboard?.ingenieros?.map((ingeniero) => (
                      <button
                        key={ingeniero.id}
                        onClick={() => handleSelectEngineer(ingeniero.id)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-green-600/10 bg-green-50/40 p-3 text-left transition-all hover:border-green-400 hover:bg-green-50"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-green-200 bg-white">
                          <img src={FOTO_PATHS[ingeniero.id]} alt={ingeniero.nombre} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-ink">{ingeniero.nombre}</p>
                          <p className="text-[11px] font-bold text-slate-500">{ingeniero.usuariosEnEspera} usuarios en espera</p>
                        </div>
                        <ChevronLeft className="h-4 w-4 -rotate-180 text-green-600" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard className="p-6">
                <div className="relative z-10">
                  <p className="text-caption mb-3 text-green-700">Distribucion por estado</p>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-green-100/60">
                    {kpis.map((kpi) => (
                      <motion.div
                        key={kpi.key}
                        initial={{ width: 0 }}
                        animate={{ width: `${resumen?.totalTickets ? Math.max((kpi.valor / resumen.totalTickets) * 100, kpi.valor > 0 ? 4 : 0) : 0}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className={`h-full bg-linear-to-r ${kpi.grad}`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {kpis.map((kpi) => (
                      <span key={kpi.key} className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600">
                        <span className={`h-2 w-2 rounded-full bg-linear-to-r ${kpi.grad}`} />
                        {kpi.label}: {kpi.valor}
                      </span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </section>
        </>
      )}

      <NotificacionToast notificacion={notificacion} />
    </div>
  )
}

function AdminHeader({ onRefresh, onLogout }) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING}
      className={`mb-8 flex items-center justify-between overflow-hidden rounded-2xl border px-4 sm:px-5 ${'border-green-600/10 bg-white/70 shadow-[0_4px_12px_rgb(0,102,51,0.10)] backdrop-blur-2xl'}`}
    >
      <button onClick={onRefresh} className="relative z-10 flex min-h-12 cursor-pointer items-center" aria-label="Recargar panel" title="Actualizar datos">
        <SaiaLogo compact />
      </button>
      <nav className="relative z-10 hidden items-center gap-2 md:flex" aria-label="Navegacion principal">
        <span className="relative rounded-xl bg-green-100 px-4 py-2 text-sm font-extrabold text-green-800">
          <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl border border-green-300 bg-green-100" transition={SPRING} />
          <span className="relative z-10 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Panel Admin
          </span>
        </span>
        <button
          onClick={() => { window.location.hash = '#/admin/validar-qr' }}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          Validar QR
        </button>
      </nav>
      <button
        onClick={onLogout}
        className="relative z-10 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-green-600/10 bg-white px-3 py-2 text-sm font-extrabold text-green-700 shadow-sm transition-colors hover:bg-green-50"
        aria-label="Cerrar sesion"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </motion.header>
  )
}



function BannerEjecutivo({ onEscanear, onReporte }) {
  return (
    <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-emerald-500/20 shadow-2xl rounded-2xl p-6 text-white mb-8">
      <div className="relative z-10">
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
          Panel de Control Central
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          ¡Hola de nuevo, <span className="text-emerald-400">Admin</span>!
        </h1>
        <p className="mt-2 max-w-2xl text-slate-300 text-sm leading-relaxed">
          Bienvenido al centro operativo SAIA-SIAD. Supervisa las solicitudes de soporte en tiempo
          real, escanea los comprobantes QR para validación presencial y gestiona la carga de trabajo
          técnica.
        </p>

        {/* Accesos Rápidos Integrados */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onEscanear}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-medium text-xs rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer text-white"
          >
            <QrCode className="h-4 w-4" /> Escanear Ticket QR
          </button>
          <button
            onClick={onReporte}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 font-medium text-xs rounded-lg backdrop-blur-sm transition-all cursor-pointer flex items-center gap-2 text-white"
          >
            <FileDown className="h-4 w-4" /> Descargar Reporte Diario
          </button>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
    </div>
  )
}

function FiltroChip({ activo, onClick, label, dot }) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all ${
        activo ? 'bg-green-600 text-white shadow-[0_4px_12px_rgb(0,102,51,0.2)]' : 'bg-green-100/70 text-green-800 hover:bg-green-100'
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-white' : dot}`} />}
      {label}
    </button>
  )
}

function Sparkline({ valores, tone = 'green' }) {
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const range = Math.max(max - min, 1)
  const puntos = valores
    .map((v, i) => `${(i / Math.max(valores.length - 1, 1)) * 100},${Math.round(30 - ((v - min) / range) * 26)}`)
    .join(' ')
  const color = tone === 'amber' ? '#f59e0b' : tone === 'blue' ? '#3b82f6' : tone === 'emerald' ? '#10b981' : '#16a34a'
  return (
    <svg viewBox="0 0 100 36" className="mt-2 h-9 w-full overflow-visible" aria-hidden="true">
      <polyline points={puntos} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={puntos.split(' ').at(-1).split(',')[0]} cy={puntos.split(' ').at(-1).split(',')[1]} r="2.5" fill={color} />
    </svg>
  )
}

function TicketsRow({ ticket, onClick }) {
  const meta = ESTADO_META[ticket.estado]
  const cedula = ticket.metadata?.cedula || ticket.usuario?.cedula || '—'
  const facultad = ticket.metadata?.facultadNombre || ticket.usuario?.facultad || '—'
  const carrera = ticket.metadata?.carrera || ticket.usuario?.carrera || '—'
  return (
    <tr className="cursor-pointer border-b border-green-600/5 transition-colors hover:bg-green-50/60" onClick={onClick}>
      <td className="px-3 py-3">
        <p className="font-mono text-xs font-black text-ink">{ticket.numero}</p>
        <p className="mt-0.5 max-w-40 truncate text-[11px] font-bold text-slate-500">{ticket.titulo}</p>
      </td>
      <td className="px-3 py-3">
        <p className="text-xs font-extrabold text-ink">{[ticket.usuario?.nombre, ticket.usuario?.apellido].filter(Boolean).join(' ') || '—'}</p>
        <p className="mt-0.5 text-[10px] font-bold text-slate-500">{ticket.usuario?.email || '—'}</p>
      </td>
      <td className="px-3 py-3">
        <p className="text-[10px] font-extrabold text-slate-600">{cedula}</p>
        <p className="mt-0.5 max-w-36 truncate text-[10px] font-bold text-slate-500">{facultad}{carrera ? ` · ${carrera}` : ''}</p>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta?.cls || 'bg-slate-100 text-slate-600'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot || 'bg-slate-400'}`} aria-hidden="true" />
          {ESTADO_LABEL(ticket.estado)}
        </span>
        {ticket.atendidoEn && <p className="mt-1 text-[9px] font-bold text-slate-400">At: {formatFecha(ticket.atendidoEn)}</p>}
      </td>
      <td className="px-3 py-3 text-[10px] font-bold text-slate-500">{formatFecha(ticket.createdAt)}</td>
      <td className="px-3 py-3 text-right">
        <button onClick={(e) => { e.stopPropagation(); onClick() }} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-green-100 hover:text-green-700" aria-label={`Ver ${ticket.numero}`}>
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

function IngenieroDetail({ ingenieroId, tickets, loading, onSelectTicket, onBack }) {
  const ingeniero = tickets[0]?.citaPersonal
  return (
    <div className="mt-5">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-green-600/10 bg-white px-3 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-50">
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
        <h2 className="text-h2 text-ink">Solicitudes de {ingeniero?.ingenieroNombre || ingenieroId}</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : tickets.length === 0 ? (
        <SpotlightCard className="p-10 text-center">
          <div className="relative z-10">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" aria-hidden="true" />
            <p className="text-h3 text-ink">Sin solicitudes pendientes</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">No hay usuarios en espera para este especialista.</p>
          </div>
        </SpotlightCard>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <SpotlightCard key={ticket.id} className="cursor-pointer p-5 transition-all hover:shadow-[0_8px_24px_rgb(0,102,51,0.10)]" onClick={() => onSelectTicket(ticket)}>
              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ESTADO_META[ticket.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">{ticket.numero} — {ticket.usuario?.nombre} {ticket.usuario?.apellido}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">{ticket.usuario?.email}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600 line-clamp-1">{ticket.titulo}</p>
                    {ticket.citaPersonal?.horaAsignada && (
                      <p className="mt-1 text-[10px] font-bold text-green-700">{formatDia(ticket.citaPersonal.fechaAsignada)} · {ticket.citaPersonal.horaAsignada}</p>
                    )}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${ESTADO_META[ticket.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                  {ESTADO_LABEL(ticket.estado)}
                </span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  )
}

function TicketDetail({ ticket, onBack }) {
  const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '')
  const meta = ticket.metadata || {}

  return (
    <div className="mt-5">
      <button onClick={onBack} className="mb-5 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-green-600/10 bg-white px-3 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-50">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      <SpotlightCard className="p-6 sm:p-8">
        <div className="relative z-10">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ESTADO_META[ticket.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-h2 text-ink">{ticket.numero}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">{ticket.titulo}</p>
            </div>
            <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-extrabold ${ESTADO_META[ticket.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
              {ESTADO_LABEL(ticket.estado)}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <InfoSection title="Datos del usuario">
                <InfoRow icon={<User className="h-4 w-4" aria-hidden="true" />} label="Nombre" value={`${ticket.usuario?.nombre || ''} ${ticket.usuario?.apellido || ''}`} />
                <InfoRow icon={<Mail className="h-4 w-4" aria-hidden="true" />} label="Email" value={ticket.usuario?.email} />
                <InfoRow icon={<User className="h-4 w-4" aria-hidden="true" />} label="Cedula" value={meta.cedula || ticket.usuario?.cedula} />
                <InfoRow icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} label="Rol" value={ROL_LABEL[ticket.usuario?.rol] || ticket.usuario?.rol} />
              </InfoSection>

              <InfoSection title="Ubicacion academica y datos del formulario">
                <InfoRow label="Facultad" value={meta.facultadNombre || ticket.usuario?.facultad} />
                <InfoRow label="Carrera" value={meta.carrera || ticket.usuario?.carrera} />
                <InfoRow label="Cargo / Area" value={meta.cargo || ticket.usuario?.cargo || '—'} />
                <InfoRow label="Atencion en persona" value={meta.atencionEnPersona ? 'Si' : 'No'} />
              </InfoSection>

              <InfoSection title="Detalles del ticket">
                <InfoRow label="Tipo" value={ticket.tipo?.replace(/_/g, ' ')} />
                <InfoRow label="Prioridad" value={ticket.prioridad} />
                <InfoRow label="Creado" value={formatFecha(ticket.createdAt)} />
                {ticket.atendidoEn && <InfoRow label="Atendido" value={formatFecha(ticket.atendidoEn)} />}
                {ticket.resueltoEn && <InfoRow label="Resuelto" value={formatFecha(ticket.resueltoEn)} />}
                {ticket.citaPersonal && (
                  <>
                    <InfoRow icon={<HardHat className="h-4 w-4" aria-hidden="true" />} label="Especialista" value={ticket.citaPersonal.ingenieroNombre} />
                    <InfoRow icon={<Calendar className="h-4 w-4" aria-hidden="true" />} label="Fecha de cita" value={`${formatDia(ticket.citaPersonal.fechaAsignada)} · ${ticket.citaPersonal.horaAsignada}`} />
                  </>
                )}
              </InfoSection>
            </div>

            <div className="space-y-4">
              <InfoSection title="Descripcion">
                <p className="text-sm font-semibold leading-7 text-slate-600">{ticket.descripcion}</p>
              </InfoSection>

              {ticket.fotoCedulaUrl && (
                <InfoSection title="Foto de Cedula">
                  <div className="overflow-hidden rounded-xl border border-green-600/10">
                    <img
                      src={`${API_BASE}${ticket.fotoCedulaUrl}`}
                      alt="Foto de cedula del usuario"
                      className="h-48 w-full object-cover"
                      onError={(e) => { e.target.alt = 'Error al cargar imagen' }}
                    />
                  </div>
                </InfoSection>
              )}

              {ticket.atendidoEn && (
                <InfoSection title="Validacion presencial">
                  <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Ticket validado en ventanilla mediante QR el {formatFecha(ticket.atendidoEn)}.
                  </div>
                </InfoSection>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}

function InfoSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-green-600/10 bg-green-50/30 p-4">
      <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-green-700">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {icon && <span className="text-green-600">{icon}</span>}
      <span className="text-xs font-bold text-slate-500">{label}:</span>
      <span className="text-sm font-extrabold text-ink">{value || '—'}</span>
    </div>
  )
}

function NotificacionToast({ notificacion }) {
  return (
    <AnimatePresence>
      {notificacion && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-extrabold shadow-[0_16px_40px_rgba(0,0,0,0.25)] ${
            notificacion.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-white text-green-800'
          }`}
          role="status"
        >
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${notificacion.tipo === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {notificacion.tipo === 'error' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          </span>
          {notificacion.mensaje}
        </motion.div>
      )}
    </AnimatePresence>
  )
}