"use server"

import prisma from "@/lib/prisma"
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
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseFloat(formData.get("price") as string)
  const stock = parseInt(formData.get("stock") as string)
  const typeId = formData.get("typeId") as string

  await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      typeId,
    },
  })

  revalidatePath("/")
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id },
  })

  revalidatePath("/")
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
