import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    console.log("Testing DB connection...");
    const user = await prisma.user.findFirst();
    console.log("Success! Found user:", user);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
