import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres"

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // For Prisma 7, we need to pass the adapter
  const adapter = new PrismaPg({ connectionString })

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

  return prisma
}

export const prisma = getPrisma()
