import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// PRNG and Shuffle utilities
function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function shuffle(array: any[], prng: () => number) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = (session?.user as any)?.role || "STUDENT";

    let questions = [];

    if (examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { randomizeQuestions: true, randomizeOptions: true }
      });

      let examQuestions = await prisma.examQuestion.findMany({
        where: { examId },
        include: {
          question: {
            include: {
              options: true,
            }
          }
        },
        orderBy: { order: "asc" },
      });

      questions = examQuestions.map(eq => ({
        ...eq.question,
        order: eq.order
      }));

      if (role === "STUDENT" && userId && exam) {
        if (exam.randomizeQuestions) {
          const seed = cyrb53(userId + examId);
          const prng = mulberry32(seed);
          questions = shuffle(questions, prng);
        }
        
        if (exam.randomizeOptions) {
          questions = questions.map((q) => {
            if (q.options && q.options.length > 0) {
              const seed = cyrb53(userId + q.id);
              const prng = mulberry32(seed);
              return {
                ...q,
                options: shuffle(q.options, prng)
              };
            }
            return q;
          });
        }
      }
    } else {
      // If no examId, fetch all questions from the bank (for Admin)
      if (role !== "ADMIN" && role !== "SUPERADMIN") {
         return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      questions = await prisma.question.findMany({
        include: { options: true },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, text, order, options, type, correctAnswer, points, difficulty, subjectId, topicId } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Missing required text field" },
        { status: 400 }
      );
    }

    const questionType = type || "MULTIPLE_CHOICE";

    // Wrap in a transaction or use nested create
    const question = await prisma.question.create({
      data: {
        text,
        type: questionType,
        points: points !== undefined ? parseFloat(points) : 1,
        correctAnswer: questionType === "SHORT_ANSWER" ? correctAnswer : null,
        difficulty: difficulty || "MEDIUM",
        subjectId: subjectId || null,
        topicId: topicId || null,
        ...(examId && order !== undefined ? {
          examQuestions: {
            create: {
              examId,
              order
            }
          }
        } : {}),
        ...(questionType === "MULTIPLE_CHOICE" && options && Array.isArray(options) ? {
          options: {
            create: options.map((opt: any) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          }
        } : {})
      },
      include: {
        options: true,
        examQuestions: true,
      },
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}
