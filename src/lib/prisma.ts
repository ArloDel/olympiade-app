import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

  return prisma
}

export const prisma = getPrisma()
