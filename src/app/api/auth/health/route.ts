import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/auth/health — Authentication system health check
// Monitors: database connectivity, user table accessibility, rate limiter state, session validity
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; duration: number; details?: string }> = {}

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', duration: Date.now() - dbStart }
  } catch (error: any) {
    checks.database = {
      status: 'error',
      duration: Date.now() - startTime,
      details: error?.message?.substring(0, 200),
    }
  }

  // Check 2: User table accessibility
  try {
    const userStart = Date.now()
    const userCount = await prisma.user.count({ where: { isActive: true, deletedAt: null } })
    checks.users = { status: 'ok', duration: Date.now() - userStart, details: `${userCount} active users` }
  } catch (error: any) {
    checks.users = {
      status: 'error',
      duration: Date.now() - startTime,
      details: error?.message?.substring(0, 200),
    }
  }

  // Check 3: Rate limiter state
  try {
    const rlStart = Date.now()
    const lockedAccounts = await prisma.rateLimitEntry.count({
      where: { lockedUntil: { not: null, gt: new Date() } },
    })
    const expiredEntries = await prisma.rateLimitEntry.count({
      where: {
        OR: [
          { lockedUntil: { not: null, lt: new Date() } },
          { resetAt: { not: null, lt: new Date() } },
        ],
      },
    })
    checks.rateLimiter = {
      status: 'ok',
      duration: Date.now() - rlStart,
      details: `${lockedAccounts} locked, ${expiredEntries} expired entries pending cleanup`,
    }
  } catch (error: any) {
    checks.rateLimiter = {
      status: 'error',
      duration: Date.now() - startTime,
      details: error?.message?.substring(0, 200),
    }
  }

  // Check 4: Auth session (checks NEXTAUTH_SECRET is configured)
  try {
    const session = await auth()
    checks.session = {
      status: 'ok',
      duration: 0,
      details: session?.user ? `Authenticated as ${session.user.email}` : 'No active session (expected for health check)',
    }
  } catch (error: any) {
    checks.session = {
      status: 'error',
      duration: 0,
      details: error?.message?.substring(0, 200),
    }
  }

  // Check 5: Environment variables
  const envChecks = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
  }
  checks.envVars = {
    status: Object.values(envChecks).every(Boolean) ? 'ok' : 'error',
    duration: 0,
    details: JSON.stringify(envChecks),
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const totalDuration = Date.now() - startTime

  return Response.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    checks,
  }, { status: allOk ? 200 : 503 })
}
