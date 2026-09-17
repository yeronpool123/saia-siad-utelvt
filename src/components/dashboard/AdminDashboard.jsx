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
  XCircle,
} from 'lucide-react'
import { io } from 'socket.io-client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import SaiaLogo from '../brand/SaiaLogo'
import SpotlightCard from '../ui/SpotlightCard'
import ValidarQRView from './ValidarQRView'
import TicketChat from './TicketChat'
import { api } from '../../lib/api'
import { socketUrl, ROL_LABEL, ESTADOS_FINALES } from '../../lib/institucional'
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
  CASO_ESPECIAL: { label: 'Caso especial', cls: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  CANCELADO_USUARIO: { label: 'Cancelado', cls: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
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
  const [selectedIngeniero, setSelectedIngeniero] = useState(null)
  const [engineerTickets, setEngineerTickets] = useState([])
  const [engineerLoading, setEngineerLoading] = useState(false)
  const [view, setView] = useState('dashboard')
  const [notificacion, setNotificacion] = useState(null)
  const notifTimer = useRef(null)
  const ticketsRef = useRef([])

  const greeting = getGreetingName(user.nombre, user.apellido)
  const nombreCompleto = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Admin'

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
      setTickets(res.data || [])
      ticketsRef.current = res.data || []
    } catch {
      setTickets([])
      ticketsRef.current = []
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
    const socket = io(socketUrl(), { transports: ['websocket', 'polling'], reconnectionAttempts: 5, auth: { token: localStorage.getItem('token') || '' } })
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
    setSelectedIngeniero(null)
    setEngineerLoading(true)
    try {
      const res = await api.get(`/admin/tickets/ingeniero/${ingenieroId}`)
      setEngineerTickets(res.data.tickets)
      setSelectedIngeniero(res.data.ingeniero)
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
    setSelectedIngeniero(null)
    setSelectedTicket(null)
    setEngineerTickets([])
  }

  const handleTicketUpdated = useCallback(async (ticketId) => {
    fetchDashboard()
    await fetchTickets()
    const actualizado = ticketsRef.current.find((t) => t.id === ticketId)
    const detalle = actualizado || (await api.get(`/tickets/${ticketId}`).then((r) => r.data).catch(() => null))
    if (detalle) setSelectedTicket(detalle)
    notificar(`Estado del ticket #${detalle?.numero || ticketId} actualizado`, 'ok')
  }, [fetchDashboard, fetchTickets, notificar])

  const exportarReporte = async () => {
    try {
      setNotificacion(null)
      if (notifTimer.current) clearTimeout(notifTimer.current)

      const res = await api.get('/admin/tickets?limit=10000')
      const tickets = res.data || []

      const logoDataUrl = await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas.getContext('2d').drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = () => resolve(null)
        img.src = '/assets/logo-utelvt.png'
      })

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()

      const headerY = 15
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 15, headerY - 3, 20, 20)
      }

      const textX = logoDataUrl ? 42 : 15
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)
      doc.text('UNIVERSIDAD TECNICA LUIS VARGAS TORRES DE ESMERALDAS', textX, headerY + 2)

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text('Sistema de Automatizacion de Identidad y Accesos (SAIA-SIAD)', textX, headerY + 8)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(22, 101, 52)
      doc.text('Reporte Consolidado de Solicitudes y Tickets', textX, headerY + 15)

      const adminName = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Admin'
      const fechaEmision = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fecha de emision: ${fechaEmision}  |  Generado por: Admin ${adminName}`, textX, headerY + 21)

      doc.setDrawColor(22, 101, 52)
      doc.setLineWidth(0.4)
      doc.line(15, headerY + 24, pageWidth - 15, headerY + 24)

      const fmtFecha = (f) => f ? new Date(f).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

      const rows = tickets.map((t) => [
        t.numero,
        [t.usuario?.nombre, t.usuario?.apellido].filter(Boolean).join(' ') || '—',
        t.categoria?.nombre || '—',
        (ESTADO_META[t.estado]?.label || t.estado || '—'),
        t.citaPersonal?.ingenieroNombre || [t.asignadoA?.nombre, t.asignadoA?.apellido].filter(Boolean).join(' ') || 'Sin asignar',
        fmtFecha(t.createdAt),
      ])

      autoTable(doc, {
        startY: headerY + 27,
        head: [['# Ticket', 'Solicitante', 'Categoria', 'Estado', 'Especialista Asignado', 'Fecha']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', font: 'helvetica' },
        headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 42 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 52 },
          5: { cellWidth: 35 },
        },
        didDrawPage: (data) => {
          const pageH = doc.internal.pageSize.getHeight()
          doc.setFontSize(7)
          doc.setTextColor(150, 150, 150)
          doc.text('SAIA-SIAD — Reporte generado automaticamente', 15, pageH - 8)
          doc.text(`Pagina ${doc.internal.getCurrentPageInfo().pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 15, pageH - 8, { align: 'right' })
        },
      })

      doc.save(`Reporte_Solicitudes_UTELVT_${new Date().toISOString().split('T')[0]}.pdf`)
      notificar('Reporte PDF generado correctamente.', 'ok')
    } catch (err) {
      console.error('Error al generar reporte PDF:', err)
      notificar('No se pudo generar el reporte PDF.', 'error')
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
        <ValidarQRView onBack={() => { window.location.hash = '' }} onAtendido={handleAtendidoDesdeQr} onLogout={onLogout} />
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
        nombreCompleto={nombreCompleto}
        onEscanear={() => { window.location.hash = '#/admin/validar-qr' }}
        onReporte={exportarReporte}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      ) : selectedTicket ? (
        <TicketDetail ticket={selectedTicket} user={user} onBack={() => setSelectedTicket(null)} onStatusApplied={handleTicketUpdated} />
      ) : selectedEngineer ? (
        <IngenieroDetail
          ingeniero={selectedIngeniero}
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
                    {(dashboard?.especialistas || dashboard?.ingenieros || [])?.map((ingeniero) => (
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



function BannerEjecutivo({ onEscanear, onReporte, nombreCompleto = 'Admin' }) {
  return (
    <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-emerald-500/20 shadow-2xl rounded-2xl p-6 text-white mb-8">
      <div className="relative z-10">
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
          Panel de Control Central
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          ¡Hola Admin <span className="text-emerald-400">{nombreCompleto}</span>!
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

function IngenieroDetail({ ingeniero, tickets, loading, onSelectTicket, onBack }) {
  return (
    <div className="mt-5">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-green-600/10 bg-white px-3 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-50">
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
        <h2 className="text-h2 text-ink">
          {loading && !ingeniero
            ? 'Cargando ingeniero...'
            : `Solicitudes de Ing. ${ingeniero?.nombre || 'Especialista'}`}
        </h2>
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

function TicketDetail({ ticket, user, onBack, onStatusApplied }) {
  const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '')
  const meta = ticket.metadata || {}
  const terminal = ESTADOS_FINALES.includes(ticket.estado)
  const esCasoEspecial = ticket.estado === 'CASO_ESPECIAL' || ticket.isSpecialCase

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

          {esCasoEspecial && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p className="text-xs font-black text-amber-900">CASO ESPECIAL ACTIVO</p>
                <p className="mt-0.5 text-xs font-bold leading-5 text-amber-800">
                  Este tramite requiere atencion PRIORITARIA en ventanilla. El usuario fue notificado que debe acercarse
                  directamente a las oficinas de TICS sin necesidad de agendar un nuevo turno.
                </p>
              </div>
            </div>
          )}

          {ticket.estado === 'CANCELADO_USUARIO' && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <p className="text-xs font-black text-rose-900">SOLICITUD CANCELADA POR EL USUARIO</p>
                <p className="mt-0.5 text-xs font-bold leading-5 text-rose-800">
                  Motivo: {ticket.cancellationReason || 'No especificado'}
                </p>
              </div>
            </div>
          )}

          {!terminal && (
            <AccionesEstado ticket={ticket} onSuccess={() => onStatusApplied(ticket.id)} />
          )}

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
                {ticket.resolucion && (
                  <div className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
                    Solucion: {ticket.resolucion}
                  </div>
                )}
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

          <div className="mt-8">
            <TicketChat ticket={ticket} currentUser={user} isAdmin />
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}

function AccionesEstado({ ticket, onSuccess }) {
  const [action, setAction] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const promptDefaults = {
    RESUELTO: `El tramite ${ticket.numero} ha sido resuelto correctamente.`,
    RECHAZADO: 'El tramite no puede ser procesado.',
    CASO_ESPECIAL: 'Requiere atencion presencial prioritaria en las oficinas de TICS.',
  }

  const abrir = (tipo) => {
    setAction(tipo)
    setDetalle(promptDefaults[tipo] || '')
    setError('')
  }

  const enviar = async () => {
    if (!action) return
    setBusy(true)
    setError('')
    try {
      await api.patch(`/tickets/${ticket.id}/estado`, {
        status: action,
        ...(action === 'RESUELTO' || action === 'CASO_ESPECIAL'
          ? { resolutionNotes: detalle.trim() }
          : { cancellationReason: detalle.trim() }),
      })
      setAction(null)
      onSuccess()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del ticket')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => abrir('RESUELTO')}
          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-[0_4px_12px_rgb(5,150,105,0.25)] transition-all hover:bg-emerald-500"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Marcar como resuelto
        </button>
        <button
          onClick={() => abrir('RECHAZADO')}
          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-[0_4px_12px_rgb(220,38,38,0.25)] transition-all hover:bg-red-500"
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancelar tramite
        </button>
        <button
          onClick={() => abrir('CASO_ESPECIAL')}
          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-900 ring-1 ring-amber-200 transition-all hover:bg-amber-100"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Marcar como caso especial
        </button>
      </div>

      <EstadoActionModal
        open={Boolean(action)}
        accion={action}
        ticket={ticket}
        detalle={detalle}
        setDetalle={setDetalle}
        busy={busy}
        error={error}
        onConfirm={enviar}
        onClose={() => setAction(null)}
      />
    </>
  )
}

function EstadoActionModal({ open, accion, ticket, detalle, setDetalle, busy, error, onConfirm, onClose }) {
  const config = {
    RESUELTO: {
      titulo: 'Marcar como resuelto',
      color: 'border-emerald-200',
      icono: <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />,
      iconoBg: 'bg-emerald-50 text-emerald-700',
      label: 'Nota de resolucion *',
      boton: 'Confirmar resolucion',
      botonCls: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_12px_rgb(5,150,105,0.3)]',
    },
    RECHAZADO: {
      titulo: 'Cancelar tramite (rechazo)',
      color: 'border-red-200',
      icono: <XCircle className="h-5 w-5 text-red-700" aria-hidden="true" />,
      iconoBg: 'bg-red-50 text-red-700',
      label: 'Motivo del rechazo *',
      boton: 'Confirmar cancelacion',
      botonCls: 'bg-red-600 hover:bg-red-500 shadow-[0_4px_12px_rgb(220,38,38,0.3)]',
    },
    CASO_ESPECIAL: {
      titulo: 'Marcar como caso especial',
      color: 'border-amber-200',
      icono: <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />,
      iconoBg: 'bg-amber-50 text-amber-600',
      label: 'Instrucciones de atencion',
      boton: 'Confirmar caso especial',
      botonCls: 'bg-amber-500 hover:bg-amber-400 shadow-[0_4px_12px_rgb(245,158,11,0.35)]',
    },
  }
  const meta = config[accion] || config.RESUELTO

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
            className={`relative w-full max-w-md rounded-3xl border-2 bg-white p-6 shadow-[0_32px_64px_rgba(0,0,0,0.25)] ${meta.color}`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconoBg}`}>
                {meta.icono}
              </span>
              <div>
                <h3 className="text-h3 text-ink">{meta.titulo}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Ticket <span className="font-mono font-black text-ink">{ticket.numero}</span> — este cambio
                  notificara al solicitante en tiempo real.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="estado-action-nota" className="mb-1 block text-xs font-extrabold text-slate-600">
                {meta.label} *
              </label>
              <textarea
                id="estado-action-nota"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                rows={3}
                className="field"
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
                disabled={busy || detalle.trim().length < 5}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 ${meta.botonCls}`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {meta.boton}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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