import { memo, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import SaiaLogo from "../brand/SaiaLogo";
import PulseIcon from "../animations/PulseIcon";
import SpotlightCard from "../ui/SpotlightCard";
import RequestForm from "./RequestForm";
import HelpModal from "./HelpModal";
import { SPRING } from "../../lib/motion";

function getGreetingName(nombre = "", apellido = "") {
  const first = nombre.trim().split(/\s+/).filter(Boolean)[0] || "";
  const last = apellido.trim().split(/\s+/).filter(Boolean)[0] || "";
  return [first, last].filter(Boolean).join(" ") || "Usuario";
}

const Dashboard = memo(function Dashboard({ user, onSubmitRequest, onInterceptSubmit, onLogout }) {
  const [ticketId, setTicketId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ripple, setRipple] = useState(false);
  const { scrollY } = useScroll();
  const greeting = getGreetingName(user.nombre, user.apellido);

  useMotionValueEvent(scrollY, "change", (value) => {
    const previous = scrollY.getPrevious() ?? 0;
    setCompact(value > 80);
    setHidden(value > 180 && value > previous);
  });

  const handleSubmit = async (payload) => {
    const result = await onSubmitRequest(payload);
    setTicketId(result.ticketId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reloadView = () => {
    setRipple(true);
    window.setTimeout(() => setRipple(false), 650);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <motion.header
        animate={{ y: hidden ? -110 : 0, height: compact ? 64 : 84 }}
        transition={SPRING}
        className={`sticky top-3 z-50 mb-8 flex items-center justify-between overflow-hidden rounded-2xl border px-4 sm:px-5 ${
          compact
            ? "border-green-600/10 bg-white/70 shadow-[0_4px_12px_rgb(0,102,51,0.10)] backdrop-blur-2xl"
            : "border-transparent bg-white/45 backdrop-blur-md"
        }`}
      >
        {ripple && (
          <motion.span
            className="absolute left-4 top-1/2 h-4 w-4 rounded-full bg-green-400/30"
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 45, opacity: 0 }}
            transition={{ duration: 0.65 }}
          />
        )}
        <button
          id="navbar-logo"
          onClick={reloadView}
          className="relative z-10 flex min-h-12 cursor-pointer items-center"
          aria-label="Recargar vista SAIA-SIAD"
        >
          <motion.span
            animate={ripple ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SaiaLogo compact={compact} />
          </motion.span>
        </button>

        <nav
          className="relative z-10 hidden items-center gap-2 md:flex"
          aria-label="Navegacion principal"
        >
          <span className="relative rounded-xl bg-green-100 px-4 py-2 text-sm font-extrabold text-green-800">
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-xl border border-green-300 bg-green-100"
              transition={SPRING}
            />
            <span className="relative z-10 flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Panel
            </span>
          </span>
          <button
            onClick={() => setHelpOpen(true)}
            className="group relative min-h-11 cursor-pointer px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:text-green-700"
            aria-label="Abrir ayuda"
          >
            <span className="flex items-center gap-2">
              <PulseIcon>
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </PulseIcon>
              Ayuda
            </span>
            <span className="absolute bottom-1 left-4 h-0.5 w-0 bg-linear-to-r from-#006633 to-#2DA866 transition-all duration-300 group-hover:w-calc(100%-2rem)" />
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

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SpotlightCard className="p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-green-600 to-green-400 text-white shadow-[0_12px_32px_rgb(0,102,51,0.18)]">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-caption mb-2 text-green-700">
                Panel principal
              </p>
              <h1 className="text-h1 text-ink">
                Hola, <span className="text-grad-animate">{greeting}</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Desde este panel podras gestionar de forma agil y segura tus
                solicitudes de reseteo de contrasenas, configuracion de correo
                institucional y recuperacion de accesos a las plataformas
                academicas.
              </p>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <div className="relative z-10 flex items-start gap-4">
            <PulseIcon className="h-12 w-12 rounded-2xl bg-green-50 text-green-700">
              <RefreshCcw className="h-6 w-6" aria-hidden="true" />
            </PulseIcon>
            <div>
              <p className="text-caption mb-2 text-green-700">
                Servicios Habilitados
              </p>
              <h2 className="text-h3 text-ink">
                Reseteo, correo y acceso SIAD
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Las solicitudes son procesadas bajo estrictos controles de
                seguridad. Recuerda que para requerimientos de acceso es
                obligatorio adjuntar tu documento de identidad para la
                validacion del personal de soporte TI.
              </p>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {ticketId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-[0_8px_30px_rgb(0,102,51,0.08)]"
          role="status"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-extrabold text-green-900">
                Solicitud enviada exitosamente
              </p>
              <p className="mt-1 text-xs font-bold text-green-800">
                Ticket de seguimiento:{" "}
                <span className="font-mono text-green-700">{ticketId}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <RequestForm user={user} onSubmit={handleSubmit} onInterceptSubmit={onInterceptSubmit} />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
})

export default Dashboard
