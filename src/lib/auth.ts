import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

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

        // In a real app, you would verify the password against a hashed password in DB
        // For this skeleton, we will find the user by email/identifier
        // Assuming email is used as identifier for now
        const user = await prisma.user.findUnique({
          where: { email: credentials.identifier }
        })

        if (!user) {
          throw new Error("User not found")
        }
        
        // Simple mock check
        if (credentials.password !== "password123") {
            throw new Error("Invalid password")
        }

        // Check if user is locked
        if (user.isLocked) {
          throw new Error("Account is locked due to suspicious activity. Please contact admin.")
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
