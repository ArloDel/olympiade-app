import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { isDemoMode, isProtectedDemoEmail } from "@/lib/demo"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "NIM / Username", type: "text", placeholder: "Masukkan NIM" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.identifier }
        })
        console.log(user)

        if (!user) {
          throw new Error("User not found")
        }

        // Simple mock check
        if (credentials.password !== "password123") {
          throw new Error("Invalid password")
        }

        const isProtectedDemoUser = isDemoMode() && isProtectedDemoEmail(user.email)

        // Check if user is locked
        if (user.isLocked) {
          if (isProtectedDemoUser) {
            await prisma.user.update({
              where: { id: user.id },
              data: { isLocked: false, warnings: 0 }
            })
            user.isLocked = false
            user.warnings = 0
          } else {
            throw new Error("Account is locked due to suspicious activity. Please contact admin.")
          }
        }

        // Check maintenance mode for students
        if (user.role === "STUDENT" && !isProtectedDemoUser) {
          const maintenanceSetting = await prisma.systemSetting.findUnique({
            where: { key: "maintenanceMode" }
          })
          if (maintenanceSetting?.value === "true") {
            throw new Error("Sistem sedang dalam pemeliharaan (Maintenance). Silakan coba lagi nanti.")
          }
        }

        return user as any
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isLocked = (user as any).isLocked
      }
      if (isDemoMode() && isProtectedDemoEmail(token.email)) {
        token.isLocked = false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isLocked = token.isLocked as boolean
      }
      return session
    }
  }
}
