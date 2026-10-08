"use server"

import prisma from "@/lib/prisma"
import { parseProductForm, parseProductId } from "@/lib/product-validation"
import { revalidatePath } from "next/cache"

export async function getProductTypes() {
  return await prisma.productType.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getProducts() {
  return await prisma.product.findMany({
    include: { type: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProduct(formData: FormData) {
  const data = parseProductForm(formData)

  await prisma.product.create({
    data,
  })

  revalidatePath("/")
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const productId = parseProductId(id)
  const data = parseProductForm(formData)

  await prisma.product.update({
    where: { id: productId },
    data,
  })

  revalidatePath("/")
  return { success: true }
}

export async function deleteProduct(id: string) {
  const productId = parseProductId(id)

  await prisma.product.delete({
    where: { id: productId },
  })

  revalidatePath("/")
  return { success: true }
}

export async function getStats() {
  const products = await prisma.product.findMany()
  
  const totalProducts = products.length
  const outOfStock = products.filter(p => p.stock === 0).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0)

  return {
    totalProducts,
    outOfStock,
    lowStock,
    totalValue
  }
}
