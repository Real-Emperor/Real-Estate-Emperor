import {
  getAuthUser,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/auth/change-password — Change the current user's password
// Required for the mustChangePassword flow
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required')
    }

    // Password policy: minimum 8 chars, at least 1 uppercase, 1 number
    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(newPassword)) {
      return errorResponse('New password must contain at least one uppercase letter')
    }
    if (!/[0-9]/.test(newPassword)) {
      return errorResponse('New password must contain at least one number')
    }
    if (newPassword === currentPassword) {
      return errorResponse('New password must be different from current password')
    }

    // Fetch the user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return errorResponse('User not found', 404)
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password)
    if (!isValidPassword) {
      return errorResponse('Current password is incorrect')
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        companyId: user.companyId,
        details: JSON.stringify({ email: user.email, method: 'self_service' }),
      },
    }).catch(() => {
      // Audit logging should not break the operation
    })

    // Clear any rate limits for this user
    await prisma.rateLimitEntry.deleteMany({
      where: { identifier: user.email },
    }).catch(() => {})

    return successResponse({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return errorResponse('Failed to change password', 500)
  }
}
