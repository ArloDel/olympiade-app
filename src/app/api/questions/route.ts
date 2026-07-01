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

    if (!examId) {
      return NextResponse.json(
        { success: false, error: "examId is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = (session?.user as any)?.role || "STUDENT";

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { randomizeQuestions: true, randomizeOptions: true }
    });

    let questions = await prisma.question.findMany({
      where: { examId },
      include: {
        options: true,
      },
      orderBy: { order: "asc" },
    });

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
    const { examId, text, order, options, type, correctAnswer, points } = body;

    if (!examId || !text || order === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const questionType = type || "MULTIPLE_CHOICE";

    // Wrap in a transaction or use nested create
    const question = await prisma.question.create({
      data: {
        examId,
        text,
        order,
        type: questionType,
        points: points !== undefined ? parseFloat(points) : 1,
        correctAnswer: questionType === "SHORT_ANSWER" ? correctAnswer : null,
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
