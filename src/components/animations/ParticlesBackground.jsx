import { useCallback, useEffect, useState } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { particlesConfig } from '../../config/particles'

export default function ParticlesBackground() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    setEnabled(desktop && !reduce)
  }, [])

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  if (!enabled) return null

  return (
    <Particles
      id="saia-particles"
      init={particlesInit}
      options={particlesConfig}
      className="fixed inset-0 z-0 pointer-events-none opacity-70"
    />
  )
}
