import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, BookOpen, Building2, CreditCard, FileText, GraduationCap, ImageIcon, Loader2, Send, Upload, User, X } from 'lucide-react'
import AnimatedPointer from '../animations/AnimatedPointer'
import ScrollMorphWaves from '../animations/ScrollMorphWaves'
import SpotlightCard from '../ui/SpotlightCard'
import MiniHorario from './MiniHorario'
import { SCALE_TAP } from '../../lib/motion'
import { FACULTAD_LISTA, getCarrerasDeFacultad, ROLES_UNIVERSITARIOS, isValidCedulaEC, ROL_LABEL, FACULTADES } from '../../lib/institucional'

const MOTIVOS = [
  { value: 'reseteo-siad', label: 'Reseteo SIAD' },
  { value: 'correo-institucional', label: 'Correo Institucional' },
  { value: 'credenciales-siad', label: 'Credenciales SIAD' },
  { value: 'ambos', label: 'Correo + SIAD' },
  { value: 'atencion-persona', label: 'Atencion en Persona' },
]

const MAX_DESCRIPCION = 1000
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-bold text-green-800'

const RequestForm = memo(function RequestForm({ user, onSubmit, onInterceptSubmit }) {
  const userRol = user?.rol || 'ESTUDIANTE'
  const [form, setForm] = useState(() => ({
    nombres: user?.nombre ? [user.nombre, user.apellido].filter(Boolean).join(' ') : '',
    cedula: user?.cedula || '',
    rol: userRol,
    facultad: user?.facultad || '',
    carrera: user?.carrera || '',
    cargo: user?.cargo || '',
    motivo: '',
    descripcion: '',
  }))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null)
  const fileInputRef = useRef(null)

  const esAtencionPersona = form.motivo === 'atencion-persona'
  const esEstudiante = form.rol === 'ESTUDIANTE'
  const carreras = useMemo(() => getCarrerasDeFacultad(form.facultad), [form.facultad])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', submit: '' }))
    if (field === 'facultad') {
      setForm((prev) => ({ ...prev, carrera: '' }))
      setErrors((prev) => ({ ...prev, carrera: '' }))
    }
    if (field === 'motivo' && value !== 'atencion-persona') {
      setHorarioSeleccionado(null)
    }
  }

  const validateFile = (candidate) => {
    if (!ACCEPTED_TYPES.includes(candidate.type)) return 'Solo se permiten imagenes JPG, PNG o WebP.'
    if (candidate.size > MAX_FILE_SIZE) return 'El archivo no debe superar 5 MB.'
    return null
  }

  const processFile = useCallback((candidate) => {
    const fileError = validateFile(candidate)
    if (fileError) {
      setErrors((prev) => ({ ...prev, file: fileError }))
      return
    }
    setFile(candidate)
    setErrors((prev) => ({ ...prev, file: '' }))
    const reader = new FileReader()
    reader.onload = (event) => setPreview(event.target.result)
    reader.readAsDataURL(candidate)
  }, [])

  const validate = () => {
    const nextErrors = {}
    if (!form.nombres.trim()) nextErrors.nombres = 'Los nombres completos son obligatorios.'

    const cedulaClean = form.cedula.replace(/\D/g, '')
    if (!cedulaClean) nextErrors.cedula = 'La cedula es obligatoria.'
    else if (!/^\d{10}$/.test(cedulaClean)) nextErrors.cedula = 'La cédula ecuatoriana debe tener 10 dígitos.'
    else if (!isValidCedulaEC(cedulaClean)) nextErrors.cedula = 'La cédula ingresada no es una cédula ecuatoriana válida.'

    if (!form.facultad) nextErrors.facultad = 'Selecciona tu facultad.'
    if (esEstudiante && !form.carrera) nextErrors.carrera = 'Selecciona tu carrera.'
    if (!esEstudiante && !form.cargo.trim()) nextErrors.cargo = 'Indica tu cargo, departamento o área.'

    if (!form.motivo) nextErrors.motivo = 'Selecciona el motivo de la solicitud.'
    if (!form.descripcion.trim()) nextErrors.descripcion = 'La descripcion es obligatoria.'
    else if (form.descripcion.trim().length < 20) nextErrors.descripcion = 'La descripcion debe tener al menos 20 caracteres.'
    if (!file) nextErrors.file = 'Debes adjuntar la foto de tu cedula de identidad.'

    if (esAtencionPersona && (!horarioSeleccionado || !horarioSeleccionado.hora)) {
      nextErrors.horario = 'Debes seleccionar un turno en el Mini-Horario.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = (extra = {}) => ({
    userEmail: user.email,
    nombresCompletos: form.nombres.trim(),
    cedulaIdentidad: form.cedula.replace(/\D/g, ''),
    rolUsuario: form.rol,
    facultad: form.facultad,
    facultadNombre: FACULTADES[form.facultad]?.nombre || form.facultad,
    carrera: form.carrera,
    cargo: form.rol === 'ESTUDIANTE' ? '' : form.cargo.trim(),
    programaAcademico: [FACULTADES[form.facultad]?.nombre, form.carrera].filter(Boolean).join(' • '),
    motivoSolicitud: form.motivo,
    descripcion: form.descripcion.trim(),
    archivoCedula: file,
    fechaSolicitud: new Date().toISOString(),
    ...extra,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (esAtencionPersona) {
        onInterceptSubmit(buildPayload({ horario: horarioSeleccionado }))
      } else {
        await onSubmit(buildPayload())
      }
    } catch {
      setErrors({ submit: 'Error al procesar la solicitud. Intenta nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const FieldError = ({ message }) =>
    message ? (
      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden="true" />
        {message}
      </p>
    ) : null

  return (
    <section id="request-form-shell" className="relative mt-6 w-full" aria-labelledby="request-title">
      <ScrollMorphWaves />
      <SpotlightCard as={motion.section} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="p-5 sm:p-8 lg:p-10">
        <div className="relative z-10">
          <header className="mb-8">
            <p className="text-caption mb-2 text-green-700">Nuevo requerimiento</p>
            <h2 id="request-title" className="text-h2 text-grad-animate">Formulario de Requerimiento</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
              Completa los campos para procesar solicitudes de contrasena, correo institucional o credenciales SIAD.
              Las facultades y carreras se filtran automaticamente segun el arbol institucional de la UTELVT.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7">
              <div className="space-y-5">
                <div>
                  <label htmlFor="nombres" className={labelClass}>
                    <User className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Nombres Completos <span className="text-red-600">*</span>
                  </label>
                  <input id="nombres" type="text" value={form.nombres} onChange={(event) => updateField('nombres', event.target.value)} placeholder="Juan Carlos Perez Garcia" required className="field" />
                  <FieldError message={errors.nombres} />
                </div>

                <div className="relative">
                  <label htmlFor="cedula" className={labelClass}>
                    <CreditCard className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Numero de Cedula <span className="text-red-600">*</span>
                  </label>
                  <input id="cedula" type="text" inputMode="numeric" maxLength={10} value={form.cedula} onChange={(event) => updateField('cedula', event.target.value.replace(/\D/g, ''))} placeholder="0823456789" required className="field peer" />
                  <FieldError message={errors.cedula} />
                </div>

                <div>
                  <label htmlFor="rol-form" className={labelClass}>
                    <GraduationCap className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Rol Universitario
                  </label>
                  <select id="rol-form" value={form.rol} onChange={(event) => updateField('rol', event.target.value)} className="field cursor-pointer appearance-none">
                    {ROLES_UNIVERSITARIOS.map((rol) => (
                      <option key={rol.value} value={rol.value}>{rol.label}</option>
                    ))}
                  </select>
                  <FieldError message={errors.rol} />
                </div>

                <div>
                  <label htmlFor="facultad-form" className={labelClass}>
                    <Building2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Facultad
                  </label>
                  <select id="facultad-form" value={form.facultad} onChange={(event) => updateField('facultad', event.target.value)} required className="field cursor-pointer appearance-none">
                    <option value="" disabled>Selecciona tu facultad</option>
                    {FACULTAD_LISTA.map((facultad) => (
                      <option key={facultad.codigo} value={facultad.codigo}>{facultad.nombre}</option>
                    ))}
                  </select>
                  <FieldError message={errors.facultad} />
                </div>

                {form.facultad && (
                  <div>
                    <label htmlFor="carrera-form" className={labelClass}>
                      <BookOpen className="h-4 w-4 text-green-600" aria-hidden="true" />
                      Carrera
                    </label>
                    <select id="carrera-form" value={form.carrera} onChange={(event) => updateField('carrera', event.target.value)} required disabled={!form.facultad} className="field cursor-pointer appearance-none disabled:opacity-60">
                      <option value="" disabled>Selecciona tu carrera</option>
                      {carreras.map((carrera) => (
                        <option key={carrera} value={carrera}>{carrera}</option>
                      ))}
                    </select>
                    <FieldError message={errors.carrera} />
                  </div>
                )}

                {form.facultad && !esEstudiante && (
                  <div>
                    <label htmlFor="cargo-form" className={labelClass}>
                      <Building2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                      Cargo / Departamento / Area
                    </label>
                    <input id="cargo-form" type="text" value={form.cargo} onChange={(event) => updateField('cargo', event.target.value)} placeholder="Ej. Coordinador Academico" required className="field" />
                    <FieldError message={errors.cargo} />
                  </div>
                )}

                <div>
                  <label htmlFor="motivo" className={labelClass}>
                    <FileText className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Motivo de Solicitud <span className="text-red-600">*</span>
                  </label>
                  <select id="motivo" value={form.motivo} onChange={(event) => updateField('motivo', event.target.value)} required className="field cursor-pointer appearance-none">
                    <option value="" disabled>Selecciona el motivo</option>
                    {MOTIVOS.map((motivo) => <option key={motivo.value} value={motivo.value}>{motivo.label}</option>)}
                  </select>
                  <FieldError message={errors.motivo} />
                </div>

                {form.rol && (
                  <p className="rounded-xl border border-green-600/10 bg-green-50/60 px-3 py-2 text-xs font-bold text-green-800">
                    Perfil detectado: {ROL_LABEL[form.rol] || form.rol}
                  </p>
                )}

                <AnimatePresence>
                  {esAtencionPersona && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    >
                      <MiniHorario
                        value={horarioSeleccionado}
                        onChange={setHorarioSeleccionado}
                      />
                      <FieldError message={errors.horario} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="descripcion" className={labelClass}>
                    <FileText className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Descripcion del Problema <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="descripcion"
                    value={form.descripcion}
                    onChange={(event) => {
                      if (event.target.value.length <= MAX_DESCRIPCION) updateField('descripcion', event.target.value)
                    }}
                    placeholder="Describe con detalle el inconveniente con tus credenciales..."
                    required
                    rows={6}
                    className="field resize-none"
                    aria-describedby="desc-counter"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <FieldError message={errors.descripcion} />
                    <span id="desc-counter" className={`ml-auto text-xs font-bold ${form.descripcion.length >= MAX_DESCRIPCION ? 'text-amber-700' : 'text-slate-500'}`}>
                      {form.descripcion.length}/{MAX_DESCRIPCION}
                    </span>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>
                    <ImageIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Foto de Cedula <span className="text-red-600">*</span>
                  </p>

                  {!preview ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
                      }}
                      onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setDragOver(false)
                        const dropped = event.dataTransfer.files[0]
                        if (dropped) processFile(dropped)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                        dragOver ? 'scale-[1.01] border-green-500 bg-green-50' : 'border-green-600/20 bg-white hover:border-green-400 hover:bg-green-50/60'
                      }`}
                      aria-label="Zona para arrastrar o seleccionar foto de cedula"
                    >
                      <motion.div animate={dragOver ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Upload className="h-10 w-10 text-green-700" aria-hidden="true" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-extrabold text-green-900">Arrastra tu imagen aqui</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">o haz clic para seleccionar. JPG, PNG, WebP. Max. 5 MB</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                        const selected = event.target.files[0]
                        if (selected) processFile(selected)
                      }} className="sr-only" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-green-600/15 bg-white">
                      <img src={preview} alt="Vista previa de cedula de identidad" className="h-48 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-linear-to-t from-black/70 to-transparent p-3">
                        <span className="max-w-[70%] truncate text-xs font-bold text-white">{file?.name}</span>
                        <button type="button" onClick={removeFile} className="flex min-h-9 cursor-pointer items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-extrabold text-white transition-colors hover:bg-red-700" aria-label="Eliminar imagen">
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                  <FieldError message={errors.file} />
                </div>
              </div>
            </div>

            {errors.submit && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
                {errors.submit}
              </p>
            )}

            <motion.button type="submit" disabled={loading} {...SCALE_TAP} className="btn-primary flex w-full items-center justify-center gap-3 py-4 text-lg">
              {loading ? (
                <>
                  <Loader2 className="relative z-10 h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="relative z-10">Procesando...</span>
                </>
              ) : (
                <>
                  <Send className="relative z-10 h-5 w-5" aria-hidden="true" />
                  <span className="relative z-10">{esAtencionPersona ? 'Solicitar Atencion en Persona' : 'Enviar Solicitud'}</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </SpotlightCard>
    </section>
  )
})

export default RequestForm