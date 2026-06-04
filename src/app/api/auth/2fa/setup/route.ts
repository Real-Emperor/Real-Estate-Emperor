import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'
import { authenticator } from 'otplib'

// POST /api/auth/2fa/setup — Generate TOTP secret and QR code URL
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    // Check if 2FA already enabled
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.twoFactorEnabled) {
      return errorResponse('2FA is already enabled. Disable it first to set up again.')
    }

    // Generate secret
    const secret = authenticator.generateSecret()
    const serviceName = 'Al Reef Dashboard'
    const otpauth = authenticator.keyuri(user.email, serviceName, secret)

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    })

    return successResponse({
      secret,
      qrCodeUrl: otpauth,
      manualEntryKey: secret,
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return errorResponse('Failed to set up 2FA', 500)
  }
}
