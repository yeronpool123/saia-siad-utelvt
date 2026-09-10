import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

function SimpleComponent() {
  return <div><h1>Hola Testing</h1></div>
}

describe('Prueba de React Component', () => {
  it('Debe renderizar el componente correctamente', () => {
    render(<SimpleComponent />)
    expect(screen.getByText('Hola Testing')).toBeInTheDocument()
  })
})
