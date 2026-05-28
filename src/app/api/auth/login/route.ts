import { NextRequest, NextResponse } from 'next/server'

// This route is now handled by NextAuth at /api/auth/[...nextauth]
// Keeping this file for backward compatibility - redirects to NextAuth
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Use /api/auth/callback/credentials for authentication' },
    { status: 400 }
  )
}
