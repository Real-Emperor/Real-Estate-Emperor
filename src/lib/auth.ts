import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

// Login attempt tracking for brute-force protection
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function isAccountLocked(email: string): boolean {
  const attempts = loginAttempts.get(email)
  if (!attempts) return false
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true
  }
  // Clear expired lockout
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email)
  }
  return false
}

function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 }
  attempts.count++
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION
  }
  loginAttempts.set(email, attempts)
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).trim().toLowerCase()

        // Check brute-force lockout
        if (isAccountLocked(email)) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { company: true },
        })

        if (!user || !user.isActive) {
          recordFailedAttempt(email)
          return null
        }

        // Check if user is soft-deleted
        if (user.deletedAt) {
          recordFailedAttempt(email)
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          recordFailedAttempt(email)
          return null
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(email)

        // Log the login
        try {
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN',
              entity: 'User',
              entityId: user.id,
              userId: user.id,
              companyId: user.companyId,
              details: JSON.stringify({ email: user.email, role: user.role }),
            },
          })
        } catch {
          // Audit logging should not break login
        }

        // Update passwordChangedAt if user must change password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          nameAr: user.nameAr,
          nameBn: user.nameBn,
          nameUr: user.nameUr,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.companyId = (user as any).companyId
        token.nameAr = (user as any).nameAr
        token.nameBn = (user as any).nameBn
        token.nameUr = (user as any).nameUr
        token.mustChangePassword = (user as any).mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).companyId = token.companyId as string
        ;(session.user as any).nameAr = token.nameAr as string | null
        ;(session.user as any).nameBn = token.nameBn as string | null
        ;(session.user as any).nameUr = token.nameUr as string | null
        ;(session.user as any).mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (reduced from 24 for security)
  },
  secret: process.env.NEXTAUTH_SECRET,
})
