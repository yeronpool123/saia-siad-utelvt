import { motion } from 'framer-motion'
import { HeadphonesIcon, KeyRound, LogIn, MailCheck, ShieldCheck, UserPlus } from 'lucide-react'
import Tilt from 'react-parallax-tilt'
import PulseIcon from '../animations/PulseIcon'
import TypewriterEffect from '../animations/TypewriterEffect'
import { SCALE_TAP } from '../../lib/motion'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const features = [
  {
    icon: KeyRound,
    title: 'Reseteo SIAD',
    desc: 'Verificacion guiada para recuperar accesos institucionales con trazabilidad.',
  },
  {
    icon: MailCheck,
    title: 'Correo Institucional',
    desc: 'Solicitudes para cuentas, alias y soporte de correo universitario.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Soporte TI',
    desc: 'Un canal claro para requerimientos de identidad y credenciales.',
  },
]

export default function WelcomePanel({ onLogin, onRegister }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]" aria-labelledby="welcome-title">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center lg:text-left"
      >
        {/* AQUÍ ESTÁ EL LOGO INSERTADO */}
        <div className="mb-8 flex justify-center lg:justify-start lg:-ml-28">
          <img 
            src="/logo-utelvt.png" 
            alt="Logo Oficial UTELVT" 
            className="h-24 w-auto object-contain drop-shadow-sm" 
          />
        </div>

        <p className="text-caption mb-3 text-green-700">Portal institucional UTELVT</p>
        <h1 id="welcome-title" className="text-display mb-3 text-ink">
          <span className="text-grad-animate">SAIA-SIAD</span>
        </h1>
        <p className="mx-auto mb-4 max-w-2xl text-[clamp(1rem,2vw,1.12rem)] font-extrabold leading-8 text-green-800 lg:mx-0">
          Sistema Automatizado de Atención e Incidencias Administrativas
        </p>
        <div className="mb-1 flex items-center justify-center gap-3 lg:justify-start">
          <span className="hidden h-px flex-1 max-w-16 bg-linear-to-r from-transparent to-green-600/40 sm:block" aria-hidden="true" />
          <TypewriterEffect />
          <span className="hidden h-px flex-1 max-w-16 bg-linear-to-l from-transparent to-green-600/40 sm:block" aria-hidden="true" />
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-[clamp(1rem,2vw,1.12rem)] font-semibold leading-8 text-slate-600 lg:mx-0">
          SAIA-SIAD centraliza reseteos de contrasena, correos institucionales y credenciales SIAD
          en una experiencia limpia, segura y rapida.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <motion.button onClick={onLogin} {...SCALE_TAP} className="btn-primary flex items-center justify-center gap-2">
            <LogIn className="relative z-10 h-5 w-5" aria-hidden="true" />
            <span className="relative z-10">Iniciar Sesion</span>
          </motion.button>
          <motion.button onClick={onRegister} {...SCALE_TAP} className="btn-secondary flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            Crear Cuenta
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.55 }}
        className="relative"
      >
        <div className="absolute -inset-6 rounded-2rem bg-green-500/5 blur-3xl" aria-hidden="true" />
        <div className="glass-card relative rounded-3xl p-5 sm:p-6">
          <div className="mb-5 rounded-2xl border border-green-600/10 bg-white p-6 text-center shadow-[0_8px_30px_rgb(0,102,51,0.08)]">
            <div className="mb-4 flex justify-center">
              <PulseIcon className="h-14 w-14 rounded-full bg-green-50 text-green-700">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
              </PulseIcon>
            </div>
            <h2 className="text-h2 text-ink">Portal seguro activo</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Disenado para usuarios estudiantes, docentes, administrativos y equipo TI.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => {
              const Card = (
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.09 }}
                  className="rounded-2xl border border-green-600/10 bg-white p-4 shadow-[0_8px_30px_rgb(0,102,51,0.06)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <feature.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-h3 text-ink">{feature.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{feature.desc}</p>
                    </div>
                  </div>
                </motion.article>
              )

              return isDesktop ? (
                <Tilt key={feature.title} tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable glareMaxOpacity={0.12} glareColor="#006633">
                  {Card}
                </Tilt>
              ) : (
                <div key={feature.title}>{Card}</div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}