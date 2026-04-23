import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@olym.app" }
    });
    console.log("Success! User found:", user?.email);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
