import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-utils'
import bcrypt from 'bcryptjs'

// POST /api/auth/reset-password — Reset password using a valid token
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = (body.token || '').trim()
    const newPassword = (body.newPassword || '').trim()

    if (!token) {
      return errorResponse('Token is required')
    }

    if (!newPassword || newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters')
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

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return errorResponse('User not found')
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Mark the token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    // Clear any rate limits for this user
    await prisma.rateLimit.deleteMany({
      where: { identifier: user.email },
    }).catch(() => {})

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        companyId: user.companyId,
        details: JSON.stringify({ email: user.email, method: 'self_service_reset' }),
      },
    })

    return successResponse({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return errorResponse('Failed to reset password', 500)
  }
}
