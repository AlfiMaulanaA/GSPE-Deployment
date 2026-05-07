import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('🌱 Seeding database...')

  const products = [
    {
      name: 'Nexabrick IoT Gateway',
      description: 'Industrial-grade IoT gateway with support for LoRaWAN, Zigbee, and MQTT.',
      price: 299.99,
      stock: 50,
      category: 'Hardware',
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'UWB Anchor Node',
      description: 'High-precision indoor tracking anchor node for TDoA positioning systems.',
      price: 149.50,
      stock: 120,
      category: 'Sensors',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Smart Energy Meter',
      description: 'Real-time energy monitoring device with Wi-Fi connectivity and API integration.',
      price: 85.00,
      stock: 5,
      category: 'Smart Home',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Industrial PLC Controller',
      description: 'Programmable logic controller for automation and process control.',
      price: 450.00,
      stock: 15,
      category: 'Hardware',
      image: 'https://images.unsplash.com/photo-1537467300445-3c926f639218?auto=format&fit=crop&q=80&w=800'
    }
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product
    })
  }

  console.log('✅ Seeding complete!')
  await pool.end()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
