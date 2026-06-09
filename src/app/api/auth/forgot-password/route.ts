import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-utils'
import { checkApiRateLimit, recordApiRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

// POST /api/auth/forgot-password — Generate a password reset token and email it
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email) {
      return errorResponse('Email is required')
    }

    // Rate limit: max 3 requests per email per 15 minutes
    const rateKey = `forgot-pw:${email}`
    const rateCheck = await checkApiRateLimit(rateKey, 3, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs)
    }

    // Also rate limit by IP to prevent abuse
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const ipRateKey = `forgot-pw-ip:${ip}`
    const ipRateCheck = await checkApiRateLimit(ipRateKey, 10, 60 * 60 * 1000) // 10 per hour per IP
    if (!ipRateCheck.allowed) {
      return rateLimitResponse(ipRateCheck.retryAfterMs)
    }

    // Always return the same message to prevent email enumeration
    const genericResponse = successResponse({
      message: 'If an account with that email exists, a reset link has been sent to your email address.',
    })

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email }, include: { company: true } })

    if (!user || !user.isActive) {
      // Record rate limit attempt but don't reveal that user doesn't exist
      await recordApiRateLimit(rateKey, 3, 15 * 60 * 1000)
      await recordApiRateLimit(ipRateKey, 10, 60 * 60 * 1000)
      return genericResponse
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Create the reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    })

    // Build the reset link
    const baseUrl = process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`
    const resetLink = `${baseUrl}?view=reset-password&token=${token}`

    // Send the reset email
    const emailResult = await sendPasswordResetEmail(
      email,
      resetLink,
      user.company?.name || 'Real Estate Emperor'
    )

    // Record rate limit attempt
    await recordApiRateLimit(rateKey, 3, 15 * 60 * 1000)
    await recordApiRateLimit(ipRateKey, 10, 60 * 60 * 1000)

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        companyId: user.companyId,
        details: JSON.stringify({
          email: user.email,
          emailSent: emailResult.success,
          emailError: emailResult.error,
        }),
      },
    }).catch(() => {})

    return genericResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return errorResponse('Failed to process request', 500)
  }
}
