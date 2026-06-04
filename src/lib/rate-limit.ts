import prisma from '@/lib/db'

// Generic rate limiter for API endpoints
export async function checkApiRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<{ allowed: boolean; remainingAttempts: number; retryAfterMs?: number }> {
  try {
    const record = await prisma.rateLimit.findUnique({ where: { identifier } })

    if (!record) {
      return { allowed: true, remainingAttempts: maxAttempts }
    }

    // If lockout has expired, allow
    if (record.lockedUntil && new Date(record.lockedUntil) < new Date()) {
      await prisma.rateLimit.delete({ where: { identifier } }).catch(() => {})
      return { allowed: true, remainingAttempts: maxAttempts }
    }

    // Still locked
    if (record.count >= maxAttempts && record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
      const retryAfterMs = new Date(record.lockedUntil).getTime() - Date.now()
      return { allowed: false, remainingAttempts: 0, retryAfterMs }
    }

    return { allowed: true, remainingAttempts: maxAttempts - record.count }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // If DB check fails, allow (fail open)
    return { allowed: true, remainingAttempts: maxAttempts }
  }
}

export async function recordApiRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  lockoutMs: number = 15 * 60 * 1000
): Promise<void> {
  try {
    const record = await prisma.rateLimit.findUnique({ where: { identifier } })

    if (!record) {
      await prisma.rateLimit.create({
        data: { identifier, count: 1, lockedUntil: null },
      })
    } else {
      const newCount = record.count + 1
      const lockedUntil = newCount >= maxAttempts
        ? new Date(Date.now() + lockoutMs)
        : record.lockedUntil

      await prisma.rateLimit.update({
        where: { identifier },
        data: { count: newCount, lockedUntil },
      })
    }
  } catch (error) {
    console.error('Rate limit record error:', error)
  }
}

export async function clearApiRateLimit(identifier: string): Promise<void> {
  try {
    await prisma.rateLimit.delete({ where: { identifier } }).catch(() => {})
  } catch (error) {
    console.error('Rate limit clear error:', error)
  }
}

// Helper to create a rate-limited response
export function rateLimitResponse(retryAfterMs?: number) {
  const retryAfterSeconds = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 900
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
