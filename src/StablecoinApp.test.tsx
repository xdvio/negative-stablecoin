import React from 'react'
import { render } from '@testing-library/react'
import StablecoinApp from './StablecoinApp'

test('renders learn react link', () => {
  const { getByText } = render(<StablecoinApp />)
  const linkElement = getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})
