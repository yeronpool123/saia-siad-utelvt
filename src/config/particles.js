export const particlesConfig = {
  background: { color: 'transparent' },
  fpsLimit: 60,
  particles: {
    number: { value: 38, density: { enable: true, area: 1200 } },
    color: { value: ['#006633', '#2DA866', '#E2E8E5'] },
    opacity: { value: { min: 0.08, max: 0.24 } },
    size: { value: { min: 1, max: 2.5 } },
    links: {
      enable: true,
      distance: 132,
      color: '#006633',
      opacity: 0.08,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.45,
      direction: 'top',
      random: true,
      outModes: 'out',
    },
  },
  interactivity: {
    events: { onHover: { enable: true, mode: 'repulse' } },
    modes: { repulse: { distance: 92, duration: 0.45 } },
  },
  detectRetina: true,
}
