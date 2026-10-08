import { describe, expect, it } from 'vitest'

import {
  parseProductForm,
  parseProductId,
  ProductValidationError,
} from './product-validation'

function validProductForm() {
  const formData = new FormData()
  formData.set('name', '  Industrial Gateway  ')
  formData.set('description', '  Edge controller  ')
  formData.set('price', '1250000.50')
  formData.set('stock', '12')
  formData.set('typeId', 'type-hardware')
  return formData
}

describe('parseProductForm', () => {
  it('normalizes a valid product form', () => {
    expect(parseProductForm(validProductForm())).toEqual({
      name: 'Industrial Gateway',
      description: 'Edge controller',
      price: 1_250_000.5,
      stock: 12,
      typeId: 'type-hardware',
    })
  })

  it('stores an empty description as null', () => {
    const formData = validProductForm()
    formData.set('description', '   ')

    expect(parseProductForm(formData).description).toBeNull()
  })

  it.each([
    ['negative price', 'price', '-1'],
    ['non-finite price', 'price', 'Infinity'],
    ['fractional stock', 'stock', '1.5'],
    ['negative stock', 'stock', '-1'],
    ['missing type', 'typeId', ''],
  ])('rejects %s', (_caseName, field, value) => {
    const formData = validProductForm()
    formData.set(field, value)

    expect(() => parseProductForm(formData)).toThrow(ProductValidationError)
  })

  it('rejects an uploaded file where text is required', () => {
    const formData = validProductForm()
    formData.set('name', new Blob(['not text']), 'name.txt')

    expect(() => parseProductForm(formData)).toThrow('name must be text')
  })
})

describe('parseProductId', () => {
  it('trims a valid id', () => {
    expect(parseProductId('  product-1 ')).toBe('product-1')
  })

  it.each([null, '', ' '.repeat(2), 'x'.repeat(129)])('rejects invalid id %j', (id) => {
    expect(() => parseProductId(id)).toThrow(ProductValidationError)
  })
})
