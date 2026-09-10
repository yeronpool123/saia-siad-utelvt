import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Clock, BookOpen, HeadphonesIcon } from 'lucide-react'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

export default function HelpModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-green-600/10 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.2)]"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <div className="flex items-center justify-between border-b border-green-600/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <HeadphonesIcon className="h-5 w-5" />
                </span>
                <h2 id="help-title" className="text-h3 text-ink">Centro de Ayuda</h2>
              </div>
              <button
                onClick={onClose}
                className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700"
                aria-label="Cerrar ayuda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="rounded-2xl border border-green-600/10 bg-green-50/50 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-green-800">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  Guia rapida de uso
                </h3>
                <ul className="space-y-2 text-sm font-semibold leading-6 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    Completa el formulario con tus datos personales y de solicitud.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    Adjunta una foto legible de tu cedula de identidad.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    Recibiras un numero de ticket para dar seguimiento a tu caso.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    El equipo de soporte TI te respondera en un maximo de 48 horas.
                  </li>
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-green-600/10 bg-white p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-green-800">
                    <Mail className="h-4 w-4 text-green-600" />
                    Mesa de Ayuda
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">soporte@utelvt.edu.ec</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">Respuesta en 24-48 hrs</p>
                </div>
                <div className="rounded-2xl border border-green-600/10 bg-white p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-green-800">
                    <Clock className="h-4 w-4 text-green-600" />
                    Horarios
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">Lun - Vie, 8:00 - 17:00</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">Sabados, 9:00 - 13:00</p>
                </div>
              </div>
            </div>

            <div className="border-t border-green-600/10 px-6 py-4 text-center">
              <p className="text-xs font-bold text-slate-400">
                SAIA-SIAD v1.0 &mdash; UTELVT &mdash; Soporte TI
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
