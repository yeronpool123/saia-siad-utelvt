import { motion } from 'framer-motion'

export default function SaiaLogo({ compact = false, light = false, className = '' }) {
  const textColor = light ? 'text-white' : 'text-green-700'
  const subColor = light ? 'text-white/70' : 'text-green-500'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.svg
        viewBox="0 0 200 200"
        className={compact ? 'h-11 w-11 shrink-0' : 'h-16 w-16 shrink-0'}
        aria-hidden="true"
        initial={{ scale: 0.86, rotate: -120, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1, y: compact ? 0 : [0, -3, 0] }}
        transition={{
          scale: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
          rotate: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: 0.4 },
          y: { duration: 3, repeat: compact ? 0 : Infinity, ease: 'easeInOut' },
        }}
      >
        <defs>
          <linearGradient id="saia-ring" x1="24" x2="176" y1="24" y2="176">
            <stop stopColor="#006633" />
            <stop offset="0.55" stopColor="#00854A" />
            <stop offset="1" stopColor="#2DA866" />
          </linearGradient>
          <radialGradient id="saia-halo" cx="50%" cy="50%" r="50%">
            <stop stopColor="#66CC99" stopOpacity="0.45" />
            <stop offset="1" stopColor="#66CC99" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="88" fill="white" stroke="url(#saia-ring)" strokeWidth="12" />
        <circle cx="100" cy="100" r="68" fill="#F5FBF8" />
        <motion.path
          d="M132 67C116 52 83 54 74 76c-9 21 16 31 36 36 22 6 34 15 27 33-8 22-43 22-64 4M70 65l14-5 4 15M129 151l-15 5-3-16"
          fill="none"
          stroke="#005328"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        />
        <circle cx="105" cy="106" r="24" fill="url(#saia-halo)" />
        <motion.circle
          cx="105"
          cy="106"
          r="7"
          fill="#2DA866"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.45 }}
        />
      </motion.svg>

      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.45 }}
          className="leading-none"
        >
          <p className={`font-display text-[clamp(1.25rem,3vw,2rem)] font-extrabold tracking-normal ${textColor}`}>
            SAIA<span className={subColor}>-SIAD</span>
          </p>
          <p className={`mt-1 text-[clamp(0.62rem,1.6vw,0.78rem)] font-bold uppercase tracking-[0.16em] ${subColor}`}>
            UTELVT
          </p>
        </motion.div>
      )}
    </div>
  )
}
