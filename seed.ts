import "dotenv/config"
import { prisma } from "./src/lib/prisma"

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@olym.app" },
    update: {},
    create: {
      email: "admin@olym.app",
      name: "Administrator",
      role: "ADMIN",
    },
  })

  const student = await prisma.user.upsert({
    where: { email: "student@olym.app" },
    update: {},
    create: {
      email: "student@olym.app",
      name: "Siswa Tes",
      role: "STUDENT",
    },
  })

  console.log("Database seeded:", { admin, student })
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
