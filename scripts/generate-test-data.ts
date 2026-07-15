import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as fs from 'fs'

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/olym_db"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Mempersiapkan data Load Test...")
  const numUsers = 100;
  let csvContent = "sessionToken,examId,questionId,optionId\n";

  // Cari satu ujian yang sedang aktif
  const exam = await prisma.exam.findFirst({
    where: { isActive: true },
    include: {
      examQuestions: {
        include: {
          question: {
            include: {
              options: true
            }
          }
        },
        take: 1
      }
    }
  })

  if (!exam) {
    throw new Error("Gagal: Tidak ada Ujian yang aktif! Tolong aktifkan minimal satu ujian di panel admin.");
  }

  const examQuestion = exam.examQuestions[0];
  if (!examQuestion || !examQuestion.question) {
    throw new Error("Gagal: Ujian yang aktif tidak memiliki soal satupun!");
  }

  const question = examQuestion.question;
  const optionId = question.options[0]?.id || "";

  // Hapus akun test sebelumnya (agar tidak bentrok jika dijalankan ulang)
  await prisma.user.deleteMany({
    where: { email: { contains: "loadtest" } }
  })
  
  console.log(`Membuat ${numUsers} Murid bayangan beserta Session Token-nya...`)

  // Buat User dan Sesi
  for (let i = 1; i <= numUsers; i++) {
    const email = `loadtest${i}@example.com`;
    const sessionToken = `test-session-token-${i}-${Date.now()}`;
    
    await prisma.user.create({
      data: {
        name: `Siswa LoadTest ${i}`,
        email,
        role: "STUDENT",
        sessions: {
          create: {
            sessionToken,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // Valid 30 hari
          }
        }
      }
    })
    
    csvContent += `${sessionToken},${exam.id},${question.id},${optionId}\n`;
  }

  fs.writeFileSync("users.csv", csvContent);
  console.log(`Sukses! Data untuk ${numUsers} murid telah disimpan ke 'users.csv'`);
  console.log(`Silakan jalankan: npx artillery run loadtest.yml`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
