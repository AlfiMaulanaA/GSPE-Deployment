'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProducts(query?: string) {
  try {
    const products = await prisma.product.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ]
      } : {},
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: products }
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return { success: false, error: 'Failed to fetch products' }
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    })
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: 'Product not found' }
  }
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const category = formData.get('category') as string
  const image = formData.get('image') as string

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        category,
        image
      }
    })
    revalidatePath('/')
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: 'Failed to create product' }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const category = formData.get('category') as string
  const image = formData.get('image') as string

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        category,
        image
      }
    })
    revalidatePath('/')
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: 'Failed to update product' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete product' }
  }
}
