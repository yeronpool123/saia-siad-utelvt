import { motion, useReducedMotion } from 'framer-motion'

export default function AnimatedPointer({ label, className = '', flip = false }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={`pointer-events-none absolute hidden lg:block ${className}`}
      initial={{ opacity: 0, x: flip ? 8 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.35 }}
      aria-hidden="true"
    >
      <motion.svg
        width="150"
        height="72"
        viewBox="0 0 150 72"
        fill="none"
        className={flip ? '-scale-x-100' : ''}
      >
        <motion.path
          d="M8 56C44 8 92 10 132 32M132 32l-14-2M132 32l-7 13"
          stroke="#006633"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 0.8, ease: 'easeInOut' }}
        />
      </motion.svg>
      <motion.span
        className="absolute -top-2 left-0 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 shadow-[0_8px_30px_rgb(0,102,51,0.08)]"
        animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.span>
    </motion.div>
  )
}
