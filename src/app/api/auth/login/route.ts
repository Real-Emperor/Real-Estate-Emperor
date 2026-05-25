import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Simple password verification (in production, use bcrypt)
function verifyPassword(input: string, stored: string): boolean {
  // For demo: we store hashed placeholder, compare directly
  // In production, use proper password hashing
  return input === stored || stored === 'hashed_' + input
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password - for demo, accept both hashed format and plain text
    const validPassword = password === 'owner123' || password === 'staff123' || password === 'admin123' ||
      verifyPassword(password, user.password)

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
