import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'
import { authenticator } from 'otplib'
import crypto from 'crypto'

// POST /api/auth/2fa/enable — Enable 2FA after verification
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    const { code } = await request.json()
    if (!code) return errorResponse('Verification code is required')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.twoFactorSecret) {
      return errorResponse('2FA setup not initiated. Call /setup first.')
    }
    if (dbUser.twoFactorEnabled) {
      return errorResponse('2FA is already enabled')
    }

    // Verify the code one more time
    const isValid = authenticator.verify({
      token: code,
      secret: dbUser.twoFactorSecret,
    })

    if (!isValid) {
      return errorResponse('Invalid verification code. Cannot enable 2FA.')
    }

    // Generate backup codes
    const backupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      companyId: user.companyId,
      details: { action: '2FA_ENABLED' },
    })

    return successResponse({
      enabled: true,
      backupCodes,
      message: '2FA has been enabled. Save these backup codes in a safe place.',
    })
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    return errorResponse('Failed to enable 2FA', 500)
  }
}
