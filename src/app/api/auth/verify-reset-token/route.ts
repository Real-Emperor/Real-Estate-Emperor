import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-utils'

// POST /api/auth/verify-reset-token — Verify a password reset token
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = (body.token || '').trim()

    if (!token) {
      return errorResponse('Token is required')
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return errorResponse('Invalid or expired reset token')
    }

    // Check if token has been used
    if (resetToken.usedAt) {
      return errorResponse('This reset token has already been used')
    }

    // Check if token has expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      return errorResponse('This reset token has expired')
    }

    return successResponse({
      valid: true,
      email: resetToken.email,
      expiresAt: resetToken.expiresAt,
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    return errorResponse('Failed to verify token', 500)
  }
}
