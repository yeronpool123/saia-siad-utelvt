import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollMorphWaves() {
  const pathRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !pathRef.current) return undefined

    const shapes = [
      'M0 82 C190 18 330 18 520 82 C700 144 840 144 1040 82 C1190 36 1320 36 1440 82 L1440 220 L0 220 Z',
      'M0 108 C180 150 340 8 526 64 C720 122 846 22 1040 92 C1196 148 1324 38 1440 70 L1440 220 L0 220 Z',
      'M0 62 C196 16 352 148 540 96 C726 44 880 146 1050 78 C1210 14 1340 126 1440 92 L1440 220 L0 220 Z',
    ]
    let index = 0

    const trigger = ScrollTrigger.create({
      trigger: '#request-form-shell',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const next = Math.min(shapes.length - 1, Math.floor(self.progress * shapes.length))
        if (next !== index) {
          index = next
          gsap.to(pathRef.current, { attr: { d: shapes[index] }, duration: 0.8, ease: 'power2.out' })
        }
      },
    })

    return () => trigger.kill()
  }, [])

  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-24 z-0 hidden h-80 w-full text-green-600 opacity-[0.03] lg:block"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M0 82 C190 18 330 18 520 82 C700 144 840 144 1040 82 C1190 36 1320 36 1440 82 L1440 220 L0 220 Z"
        fill="currentColor"
      />
    </svg>
  )
}