import prisma from '@/lib/db'
import {
  errorResponse,
  successResponse,
} from '@/lib/api-utils'
import { authenticator } from 'otplib'

// POST /api/auth/2fa/validate — Validate 2FA code during login
// This is called without auth (during the login flow)
export async function POST(request: Request) {
  try {
    const { email, code, backupCode } = await request.json()
    if (!email) return errorResponse('Email is required')
    if (!code && !backupCode) return errorResponse('Verification code or backup code is required')

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return errorResponse('2FA not configured for this user', 400)
    }

    // Check backup code first
    if (backupCode) {
      const backupCodes: string[] = user.twoFactorBackupCodes
        ? JSON.parse(user.twoFactorBackupCodes)
        : []

      const codeIndex = backupCodes.indexOf(backupCode.toUpperCase())
      if (codeIndex === -1) {
        return errorResponse('Invalid backup code')
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1)
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
      })

      return successResponse({ valid: true, method: 'backup_code' })
    }

    // Validate TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    })

    if (!isValid) {
      return errorResponse('Invalid verification code')
    }

    return successResponse({ valid: true, method: 'totp' })
  } catch (error) {
    console.error('Error validating 2FA code:', error)
    return errorResponse('Failed to validate 2FA code', 500)
  }
}
