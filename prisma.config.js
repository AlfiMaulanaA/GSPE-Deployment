// Prisma 7 Configuration (Plain JavaScript for Docker stability)
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js" // Menjalankan file hasil bundle
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
};
