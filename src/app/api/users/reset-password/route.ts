import {
  getAuthUser,
  createAuditLog,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/api-utils'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/users/reset-password - Reset a user's password (admin only)
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  if (!isSystemAdmin(user.role)) {
    return forbiddenResponse('Only system admins can reset passwords')
  }

  const body = await request.json()
  const { userId, newPassword } = body

  if (!userId || !newPassword) {
    return errorResponse('User ID and new password are required')
  }

  if (newPassword.length < 6) {
    return errorResponse('Password must be at least 6 characters long')
  }

  // Enforce password policy for admin resets
  if (newPassword.length < 8) {
    return errorResponse('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(newPassword)) {
    return errorResponse('Password must contain at least one uppercase letter')
  }
  if (!/[0-9]/.test(newPassword)) {
    return errorResponse('Password must contain at least one number')
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: userId, companyId: user.companyId },
  })

  if (!targetUser) {
    return errorResponse('User not found', 404)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: true,
      passwordChangedAt: new Date(),
    },
  })

  await createAuditLog({
    action: 'UPDATE',
    entity: 'User',
    entityId: userId,
    userId: user.id,
    companyId: user.companyId,
    details: { action: 'PASSWORD_RESET', targetEmail: targetUser.email },
  })

  return successResponse({ message: 'Password reset successfully' })
}
