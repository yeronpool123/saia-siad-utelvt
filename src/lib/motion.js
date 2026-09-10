export const EASE_OUT = [0.22, 1, 0.36, 1]

export const SPRING = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
}

export const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
}

export const SCALE_TAP = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 },
}
