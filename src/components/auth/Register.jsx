import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, CreditCard, GraduationCap, Loader2, Lock, LogIn, Mail, User, UserPlus } from 'lucide-react'
import SaiaLogo from '../brand/SaiaLogo'
import AnimatedPointer from '../animations/AnimatedPointer'
import { SCALE_TAP } from '../../lib/motion'
import { FACULTAD_LISTA, getCarrerasDeFacultad, ROLES_UNIVERSITARIOS, generateInstitutionalEmail, isValidCedulaEC } from '../../lib/institucional'

const EMAIL_REGEX = /^[^\s@]+@utelvt\.edu\.ec$/i
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-bold text-green-800'

export default function Register({ onRegister, onBack, onGoLogin }) {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    rol: 'ESTUDIANTE',
    facultad: '',
    carrera: '',
    cargo: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showCedulaTip, setShowCedulaTip] = useState(false)

  const esEstudiante = form.rol === 'ESTUDIANTE'
  const carreras = useMemo(() => getCarrerasDeFacultad(form.facultad), [form.facultad])

  const email = useMemo(
    () => generateInstitutionalEmail(form.nombres, form.apellidos),
    [form.nombres, form.apellidos]
  )

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', submit: '' }))
    if (field === 'facultad') {
      setForm((prev) => ({ ...prev, carrera: '' }))
      setErrors((prev) => ({ ...prev, carrera: '' }))
    }
    if (field === 'rol' && value === 'ESTUDIANTE') {
      setForm((prev) => ({ ...prev, cargo: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.nombres.trim()) nextErrors.nombres = 'Los nombres completos son obligatorios.'
    if (!form.apellidos.trim()) nextErrors.apellidos = 'Los apellidos completos son obligatorios.'

    const cedulaClean = form.cedula.replace(/\D/g, '')
    if (!cedulaClean) nextErrors.cedula = 'El numero de cedula es obligatorio.'
    else if (!/^\d{10}$/.test(cedulaClean)) nextErrors.cedula = 'La cédula ecuatoriana debe tener 10 dígitos.'
    else if (!isValidCedulaEC(cedulaClean)) nextErrors.cedula = 'La cédula ingresada no es una cédula ecuatoriana válida.'

    if (!form.facultad) nextErrors.facultad = 'Selecciona tu facultad.'
    if (esEstudiante && !form.carrera) nextErrors.carrera = 'Selecciona tu carrera.'
    if (!esEstudiante && !form.cargo.trim()) nextErrors.cargo = 'Indica tu cargo, departamento o área de adscripción.'

    if (!email) nextErrors.email = 'Completa tus nombres y apellidos para generar el correo.'
    else if (!EMAIL_REGEX.test(email)) nextErrors.email = 'El correo institucional debe ser @utelvt.edu.ec'

    if (!form.password) nextErrors.password = 'La contrasena es obligatoria.'
    else if (form.password.length < 8) nextErrors.password = 'La contrasena debe tener al menos 8 caracteres.'
    else if (!/[A-Z]/.test(form.password)) nextErrors.password = 'Debe incluir al menos una mayuscula.'
    else if (!/[0-9]/.test(form.password)) nextErrors.password = 'Debe incluir al menos un numero.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Debes repetir la contrasena.'
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Las contrasenas no coinciden.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onRegister({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.replace(/\D/g, ''),
        rol: form.rol,
        facultad: form.facultad,
        carrera: form.carrera,
        cargo: form.rol === 'ESTUDIANTE' ? '' : form.cargo.trim(),
        email,
        password: form.password,
      })
      setSuccess(true)
    } catch (err) {
      setErrors({ submit: err.message || 'Error al crear la cuenta.' })
    } finally {
      setLoading(false)
    }
  }

  const FieldError = ({ message }) =>
    message ? (
      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {message}
      </p>
    ) : null

  return (
    <section className="mx-auto w-full max-w-2xl" aria-labelledby="register-title">
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="text-center">
              <div className="mb-5 flex justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </span>
              </div>
              <h2 className="text-h2 text-grad-animate">Cuenta Creada</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Tu cuenta fue registrada correctamente. Ya puedes iniciar sesion con tus credenciales.
              </p>
              <motion.button onClick={onGoLogin} {...SCALE_TAP} className="btn-primary mt-8 flex w-full items-center justify-center gap-2">
                <LogIn className="relative z-10 h-5 w-5" aria-hidden="true" />
                <span className="relative z-10">Ir a Iniciar Sesion</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button onClick={onBack} className="mb-7 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-green-700 transition-colors hover:text-green-500">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver
              </button>

              <header className="mb-8 text-center">
                <div className="mb-6 flex justify-center">
                  <SaiaLogo compact />
                </div>
                <p className="text-caption mb-2 text-green-700">Alta de usuario</p>
                <h2 id="register-title" className="text-h2 text-grad-animate">Crear Cuenta</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  Completa tus datos personales y academicos. El correo institucional se genera automaticamente.
                </p>
              </header>

              <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-nombres" className={labelClass}>
                    <User className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Nombres
                  </label>
                  <input id="reg-nombres" type="text" value={form.nombres} onChange={(event) => updateField('nombres', event.target.value)} placeholder="Luis Juan" required autoComplete="given-name" className="field" />
                  <FieldError message={errors.nombres} />
                </div>

                <div>
                  <label htmlFor="reg-apellidos" className={labelClass}>
                    <User className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Apellidos
                  </label>
                  <input id="reg-apellidos" type="text" value={form.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} placeholder="Perez Garcia" required autoComplete="family-name" className="field" />
                  <FieldError message={errors.apellidos} />
                </div>

                <div>
                  <label htmlFor="reg-cedula" className={labelClass}>
                    <CreditCard className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Cedula / Pasaporte
                  </label>
                  <input id="reg-cedula" type="text" inputMode="numeric" maxLength={10} value={form.cedula} onChange={(event) => updateField('cedula', event.target.value.replace(/\D/g, ''))} onFocus={() => setShowCedulaTip(true)} onBlur={() => setShowCedulaTip(false)} placeholder="1712345678" required className="field peer" />
                  <AnimatedPointer label="Cedula ecuatoriana de 10 digitos" className="invisible peer-focus:visible -top-2 right-0 lg:right-auto lg:-left-52 lg:top-1" flip={false} />
                  <FieldError message={errors.cedula} />
                </div>

                <div>
                  <label htmlFor="reg-rol" className={labelClass}>
                    <GraduationCap className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Rol Universitario
                  </label>
                  <select id="reg-rol" value={form.rol} onChange={(event) => updateField('rol', event.target.value)} required className="field cursor-pointer appearance-none">
                    {ROLES_UNIVERSITARIOS.map((rol) => (
                      <option key={rol.value} value={rol.value}>{rol.label}</option>
                    ))}
                  </select>
                  <FieldError message={errors.rol} />
                </div>

                <div>
                  <label htmlFor="reg-facultad" className={labelClass}>
                    <Building2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Facultad
                  </label>
                  <select id="reg-facultad" value={form.facultad} onChange={(event) => updateField('facultad', event.target.value)} required className="field cursor-pointer appearance-none">
                    <option value="" disabled>Selecciona tu facultad</option>
                    {FACULTAD_LISTA.map((facultad) => (
                      <option key={facultad.codigo} value={facultad.codigo}>{facultad.nombre}</option>
                    ))}
                  </select>
                  <FieldError message={errors.facultad} />
                </div>

                <div>
                  <label htmlFor="reg-carrera" className={labelClass}>
                    <GraduationCap className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Carrera
                  </label>
                  <select id="reg-carrera" value={form.carrera} onChange={(event) => updateField('carrera', event.target.value)} required disabled={!form.facultad} className="field cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-60">
                    <option value="" disabled>{form.facultad ? 'Selecciona tu carrera' : 'Primero selecciona tu facultad'}</option>
                    {carreras.map((carrera) => (
                      <option key={carrera} value={carrera}>{carrera}</option>
                    ))}
                  </select>
                  <FieldError message={errors.carrera} />
                </div>

                <AnimatePresence>
                  {!esEstudiante && (
                    <motion.div
                      className="sm:col-span-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    >
                      <label htmlFor="reg-cargo" className={labelClass}>
                        <Building2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                        Cargo / Departamento / Area de Adscripcion
                      </label>
                      <input id="reg-cargo" type="text" value={form.cargo} onChange={(event) => updateField('cargo', event.target.value)} placeholder="Ej. Coordinador Academico, Decanato, Vicerrectorado..." required className="field" />
                      <FieldError message={errors.cargo} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="sm:col-span-2">
                  <label htmlFor="reg-email" className={labelClass}>
                    <Mail className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Correo Electronico Institucional
                  </label>
                  <div className="relative">
                    <input id="reg-email" type="email" value={email} placeholder="nombre.apellido@utelvt.edu.ec" required readOnly disabled className="field pr-11 text-green-800 opacity-90" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700" title="Generado automaticamente a partir de tus nombres y apellidos">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-slate-500">Se genera automaticamente en tiempo real y queda bloqueado para edicion manual.</p>
                  <FieldError message={errors.email} />
                </div>

                <div>
                  <label htmlFor="reg-password" className={labelClass}>
                    <Lock className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Contrasena
                  </label>
                  <input id="reg-password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Minimo 8 caracteres, 1 mayuscula, 1 numero" required autoComplete="new-password" className="field" />
                  <FieldError message={errors.password} />
                </div>

                <div>
                  <label htmlFor="reg-confirm" className={labelClass}>
                    <Lock className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Repetir
                  </label>
                  <input id="reg-confirm" type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Repite tu contrasena" required autoComplete="new-password" className="field" />
                  <FieldError message={errors.confirmPassword} />
                </div>

                {errors.submit && (
                  <p role="alert" className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {errors.submit}
                  </p>
                )}

                <motion.button type="submit" disabled={loading} {...SCALE_TAP} className="btn-primary sm:col-span-2 flex w-full items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="relative z-10 h-5 w-5 animate-spin" aria-hidden="true" />
                      <span className="relative z-10">Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="relative z-10 h-5 w-5" aria-hidden="true" />
                      <span className="relative z-10">Crear Cuenta</span>
                    </>
                  )}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm font-semibold text-slate-600">
                Ya tienes cuenta?{' '}
                <button onClick={onGoLogin} className="cursor-pointer font-extrabold text-green-700 transition-colors hover:text-green-500">
                  Iniciar Sesion
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}