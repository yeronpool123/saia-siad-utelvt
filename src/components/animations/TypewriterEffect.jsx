import { useEffect, useState } from 'react'

const TYPING_SPEED = 70
const HOLD_TIME = 2000
const BACKSPACE_SPEED = 40

const DINAMIC_PHRASES = [
  'Automatizar la gestión técnica universitaria',
  'Digitalizar solicitudes y tickets institucionales',
  'Agilizar la atención docente y estudiantil',
  'Optimizar los tiempos de respuesta en soporte TI',
]

export default function TypewriterEffect({ typingSpeed = TYPING_SPEED, holdTime = HOLD_TIME, backspaceSpeed = BACKSPACE_SPEED }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    const phrase = DINAMIC_PHRASES[phraseIndex]

    let timeout

    if (phase === 'typing') {
      timeout = setTimeout(() => {
        if (text.length < phrase.length) {
          setText(phrase.slice(0, text.length + 1))
        } else {
          setPhase('holding')
        }
      }, typingSpeed)
    } else if (phase === 'holding') {
      timeout = setTimeout(() => setPhase('backspacing'), holdTime)
    } else {
      timeout = setTimeout(() => {
        if (text.length > 0) {
          setText(phrase.slice(0, text.length - 1))
        } else {
          setPhraseIndex((prev) => (prev + 1) % DINAMIC_PHRASES.length)
          setPhase('typing')
        }
      }, backspaceSpeed)
    }

    return () => clearTimeout(timeout)
  }, [text, phase, phraseIndex, typingSpeed, holdTime, backspaceSpeed])

  return (
    <span className="typewriter-target" aria-live="polite">
      {text}
      <span className="typewriter-cursor" aria-hidden="true">
        |
      </span>
    </span>
  )
}