import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'
import bcrypt from 'bcryptjs'

// POST /api/auth/2fa/disable — Disable 2FA (requires password)
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    const { password } = await request.json()
    if (!password) return errorResponse('Password is required to disable 2FA')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.twoFactorEnabled) {
      return errorResponse('2FA is not enabled')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, dbUser.password)
    if (!isValidPassword) {
      return errorResponse('Invalid password')
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      companyId: user.companyId,
      details: { action: '2FA_DISABLED' },
    })

    return successResponse({ disabled: true, message: '2FA has been disabled.' })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return errorResponse('Failed to disable 2FA', 500)
  }
}
