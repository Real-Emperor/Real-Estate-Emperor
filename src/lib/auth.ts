import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

// ─── Auth Logging ──────────────────────────────────────────────
// Structured logging for all authentication events
// Each log entry includes: timestamp, event type, email (hashed for privacy), duration, and outcome
const AUTH_LOG_PREFIX = '[AUTH]'

function authLog(event: string, details: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const maskedEmail = typeof details.email === 'string'
    ? details.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : 'unknown'
  console.log(
    `${AUTH_LOG_PREFIX} ${timestamp} ${event}`,
    JSON.stringify({ ...details, email: maskedEmail })
  )
}

// ─── Database Retry Logic ──────────────────────────────────────
// Neon PostgreSQL cold starts can cause the first query to timeout.
// This retry logic handles transient connection failures gracefully.
const DB_RETRY_ATTEMPTS = 2
const DB_RETRY_DELAY_MS = 500

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  email: string
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= DB_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      const isTransient =
        error?.code === 'P1001' || // Connection error
        error?.code === 'P1002' || // Serverless cold start timeout
        error?.code === 'P1008' || // Operation timeout
        error?.code === 'P1011' || // Connection pool exhaustion
        error?.message?.includes('connect') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('ECONNRESET')

      if (!isTransient || attempt === DB_RETRY_ATTEMPTS) {
        authLog('DB_ERROR', {
          operation: operationName,
          email,
          attempt: attempt + 1,
          errorCode: error?.code,
          errorMessage: error?.message?.substring(0, 200),
          isTransient,
        })
        throw error
      }

      authLog('DB_RETRY', {
        operation: operationName,
        email,
        attempt: attempt + 1,
        errorCode: error?.code,
      })

      // Exponential backoff: 500ms, 1000ms
      await new Promise(resolve => setTimeout(resolve, DB_RETRY_DELAY_MS * (attempt + 1)))
    }
  }

  throw lastError
}

// ─── Rate Limiting ─────────────────────────────────────────────
// Database-backed rate limiting with the following fixes:
// 1. lastCleanup uses DB-based timestamp instead of module-level variable (serverless safe)
// 2. recordFailedAttempt ONLY records actual credential failures, NOT DB errors
// 3. Lockout checks have their own retry logic
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

async function isAccountLocked(email: string): Promise<boolean> {
  try {
    const entry = await withRetry(
      () => prisma.rateLimitEntry.findUnique({ where: { identifier: email } }),
      'rateLimitCheck',
      email
    )
    if (!entry) return false

    // Check if currently locked
    if (entry.lockedUntil && new Date() < entry.lockedUntil) {
      authLog('ACCOUNT_LOCKED', { email, lockedUntil: entry.lockedUntil, attemptCount: entry.count })
      return true
    }

    // Clear expired lockout proactively
    if (entry.lockedUntil && new Date() >= entry.lockedUntil) {
      await prisma.rateLimitEntry.delete({ where: { identifier: email } }).catch(() => {})
      authLog('LOCKOUT_EXPIRED', { email })
    }
    return false
  } catch (error) {
    authLog('RATE_LIMIT_CHECK_FAILED', { email, error: (error as Error)?.message })
    // If DB check fails, allow login attempt (fail open rather than lock out everyone)
    return false
  }
}

// IMPORTANT: This should ONLY be called when the user provides WRONG credentials.
// It must NOT be called for database errors, connection timeouts, or server errors.
async function recordFailedAttempt(email: string): Promise<void> {
  try {
    const existing = await prisma.rateLimitEntry.findUnique({ where: { identifier: email } })

    if (existing) {
      const newCount = existing.count + 1
      const lockedUntil = newCount >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : existing.lockedUntil

      await prisma.rateLimitEntry.update({
        where: { identifier: email },
        data: {
          count: newCount,
          lockedUntil,
          resetAt: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
        },
      })

      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        authLog('ACCOUNT_LOCKOUT_TRIGGERED', { email, attemptCount: newCount })
      }
    } else {
      await prisma.rateLimitEntry.create({
        data: {
          identifier: email,
          count: 1,
          resetAt: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
        },
      })
    }
  } catch (error) {
    authLog('RATE_LIMIT_RECORD_FAILED', { email, error: (error as Error)?.message })
    // Don't throw — rate limiting shouldn't block login entirely on DB failure
  }
}

async function clearFailedAttempts(email: string): Promise<void> {
  try {
    await prisma.rateLimitEntry.delete({ where: { identifier: email } }).catch(() => {})
  } catch {
    // Silent — cleanup failure shouldn't affect login
  }
}

// Serverless-safe cleanup: uses a DB query to check if cleanup is needed
// instead of a module-level variable that resets on each cold start
async function cleanupExpiredEntries(): Promise<void> {
  try {
    // Only run cleanup if there are expired entries to clean
    const expiredCount = await prisma.rateLimitEntry.count({
      where: {
        OR: [
          { lockedUntil: { not: null, lt: new Date() } },
          { resetAt: { not: null, lt: new Date() } },
        ],
      },
    })

    if (expiredCount === 0) return

    const deleted = await prisma.rateLimitEntry.deleteMany({
      where: {
        OR: [
          { lockedUntil: { not: null, lt: new Date() } },
          { resetAt: { not: null, lt: new Date() } },
        ],
      },
    })

    if (deleted.count > 0) {
      authLog('RATE_LIMIT_CLEANUP', { deletedCount: deleted.count })
    }
  } catch {
    // Silent cleanup — must not break login
  }
}

// ─── NextAuth Configuration ────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const startTime = Date.now()

        if (!credentials?.email || !credentials?.password) {
          authLog('LOGIN_MISSING_CREDENTIALS', { email: credentials?.email })
          return null
        }

        const email = (credentials.email as string).trim().toLowerCase()

        try {
          // Clean up expired rate limit entries (serverless-safe)
          await cleanupExpiredEntries()

          // Check brute-force lockout (DB-backed with retry)
          if (await isAccountLocked(email)) {
            authLog('LOGIN_LOCKED_OUT', { email, duration: Date.now() - startTime })
            return null
          }

          // Look up user with retry for cold start resilience
          let user: any
          try {
            user = await withRetry(
              () => prisma.user.findUnique({
                where: { email },
                include: { company: true },
              }),
              'findUser',
              email
            )
          } catch (dbError: any) {
            // CRITICAL FIX: Database errors should NOT count as failed login attempts
            // Previously, a cold start timeout would cause findUnique to throw,
            // which was caught by the outer catch and the user saw "Invalid credentials"
            // But more importantly, it didn't increment rate limit, so this is just
            // a bad user experience issue.
            authLog('LOGIN_DB_ERROR', {
              email,
              errorCode: dbError?.code,
              errorMessage: dbError?.message?.substring(0, 200),
              duration: Date.now() - startTime,
            })
            return null
          }

          // Check user exists and is active
          if (!user) {
            authLog('LOGIN_USER_NOT_FOUND', { email, duration: Date.now() - startTime })
            await recordFailedAttempt(email)
            return null
          }

          if (!user.isActive) {
            authLog('LOGIN_ACCOUNT_DEACTIVATED', { email, duration: Date.now() - startTime })
            await recordFailedAttempt(email)
            return null
          }

          // Check if user is soft-deleted
          if (user.deletedAt) {
            authLog('LOGIN_ACCOUNT_DELETED', { email, duration: Date.now() - startTime })
            await recordFailedAttempt(email)
            return null
          }

          // Verify password with bcrypt
          let isValidPassword: boolean
          try {
            isValidPassword = await bcrypt.compare(
              credentials.password as string,
              user.password
            )
          } catch (bcryptError) {
            authLog('LOGIN_BCRYPT_ERROR', {
              email,
              error: (bcryptError as Error)?.message,
              duration: Date.now() - startTime,
            })
            return null
          }

          if (!isValidPassword) {
            authLog('LOGIN_WRONG_PASSWORD', { email, duration: Date.now() - startTime })
            await recordFailedAttempt(email)
            return null
          }

          // Clear failed attempts on successful login
          await clearFailedAttempts(email)

          // Log the successful login
          authLog('LOGIN_SUCCESS', {
            email,
            role: user.role,
            userId: user.id,
            duration: Date.now() - startTime,
          })

          // Create audit log (non-blocking)
          prisma.auditLog.create({
            data: {
              action: 'LOGIN',
              entity: 'User',
              entityId: user.id,
              userId: user.id,
              companyId: user.companyId,
              details: JSON.stringify({ email: user.email, role: user.role, loginDuration: Date.now() - startTime }),
            },
          }).catch(() => {
            // Audit logging should not break login
          })

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
        } catch (error: any) {
          // Catch-all for unexpected errors — do NOT increment rate limit
          authLog('LOGIN_UNEXPECTED_ERROR', {
            email,
            errorCode: error?.code,
            errorMessage: error?.message?.substring(0, 200),
            duration: Date.now() - startTime,
          })
          return null
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
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})
