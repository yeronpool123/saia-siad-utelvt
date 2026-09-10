import { motion, useReducedMotion } from 'framer-motion'

const RING_DURATION = 2.4

const ringKeyframes = {
  scale: [1, 1.6, 2.1],
  opacity: [0.45, 0.28, 0],
}

const ringTransition = {
  duration: RING_DURATION,
  repeat: Infinity,
  ease: 'easeOut',
}

export default function PulseIcon({ children, className = '' }) {
  const reduce = useReducedMotion()

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      {!reduce && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-green-500/30"
            animate={ringKeyframes}
            transition={{ ...ringTransition, repeatDelay: 0.3 }}
            aria-hidden="true"
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-green-500/20"
            animate={ringKeyframes}
            transition={{ ...ringTransition, delay: RING_DURATION * 0.5, repeatDelay: 0.3 }}
            aria-hidden="true"
          />
        </>
      )}
      <motion.span
        animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 inline-flex"
      >
        {children}
      </motion.span>
    </span>
  )
}
