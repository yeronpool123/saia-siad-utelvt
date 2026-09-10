import { describe, it, expect } from 'vitest'

describe('Pruebas unitarias básicas', () => {
  it('Debe sumar correctamente', () => {
    const sum = (a, b) => a + b
    expect(sum(1, 2)).toBe(3)
  })
})
