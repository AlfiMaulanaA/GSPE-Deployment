import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Cleanup
  await prisma.product.deleteMany()
  await prisma.productType.deleteMany()

  // 2. Create Product Types
  const hardware = await prisma.productType.create({ data: { name: 'Hardware' } })
  const software = await prisma.productType.create({ data: { name: 'Software' } })
  const service = await prisma.productType.create({ data: { name: 'Service' } })

  console.log('✅ Product types created')

  // 3. Create Products
  const products = [
    {
      name: 'Nexabrick CM4 Gateway',
      description: 'Industrial IoT Gateway based on Raspberry Pi CM4',
      price: 2500000,
      stock: 50,
      typeId: hardware.id,
    },
    {
      name: 'UWB Anchor V2',
      description: 'High precision indoor positioning anchor',
      price: 1800000,
      stock: 120,
      typeId: hardware.id,
    },
    {
      name: 'GSPE Cloud License',
      description: 'Annual subscription for GSPE Monitoring Cloud',
      price: 5000000,
      stock: 1000,
      typeId: software.id,
    },
    {
      name: 'System Integration Service',
      description: 'On-site installation and configuration service',
      price: 15000000,
      stock: 10,
      typeId: service.id,
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log('✅ Sample products created')
  console.log('🌿 Seeding finished successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
