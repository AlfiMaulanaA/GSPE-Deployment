const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2_000
const MAX_PRICE = 1_000_000_000_000_000
const MAX_STOCK = 2_147_483_647
const MAX_ID_LENGTH = 128

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductValidationError'
  }
}

function readText(formData: FormData, field: string) {
  const value = formData.get(field)

  if (typeof value !== 'string') {
    throw new ProductValidationError(`${field} must be text`)
  }

  return value.trim()
}

export function parseProductId(value: unknown) {
  if (typeof value !== 'string') {
    throw new ProductValidationError('product id must be text')
  }

  const id = value.trim()
  if (!id || id.length > MAX_ID_LENGTH) {
    throw new ProductValidationError('product id is invalid')
  }

  return id
}

export function parseProductForm(formData: FormData) {
  const name = readText(formData, 'name')
  const description = readText(formData, 'description')
  const priceText = readText(formData, 'price')
  const stockText = readText(formData, 'stock')
  const typeId = readText(formData, 'typeId')

  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new ProductValidationError('name is required and must be at most 120 characters')
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ProductValidationError('description must be at most 2000 characters')
  }

  if (!typeId || typeId.length > MAX_ID_LENGTH) {
    throw new ProductValidationError('product type is invalid')
  }

  const price = Number(priceText)
  if (!priceText || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
    throw new ProductValidationError('price must be a non-negative finite number')
  }

  const stock = Number(stockText)
  if (!stockText || !Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
    throw new ProductValidationError('stock must be a non-negative integer')
  }

  return {
    name,
    description: description || null,
    price,
    stock,
    typeId,
  }
}
