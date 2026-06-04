import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'
import { authenticator } from 'otplib'

// POST /api/auth/2fa/verify — Verify a TOTP code during setup
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

    const isValid = authenticator.verify({
      token: code,
      secret: dbUser.twoFactorSecret,
    })

    if (!isValid) {
      return errorResponse('Invalid verification code. Please try again.')
    }

    return successResponse({ verified: true })
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return errorResponse('Failed to verify code', 500)
  }
}
