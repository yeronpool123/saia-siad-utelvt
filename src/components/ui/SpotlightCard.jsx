import { memo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

const SpotlightCard = memo(function SpotlightCard({ children, className = '', as: Component = motion.div, ...props }) {
  const rafRef = useRef(null)

  const handleMouseMove = useCallback((event) => {
    if (window.matchMedia('(max-width: 767px)').matches) return
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
      event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
      rafRef.current = null
    })
  }, [])

  return (
    <Component
      onMouseMove={handleMouseMove}
      className={`spotlight-card relative overflow-hidden rounded-2xl border border-green-600/10 bg-white shadow-[0_8px_30px_rgb(0,102,51,0.08)] ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

export default SpotlightCard