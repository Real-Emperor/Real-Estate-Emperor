import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow auth API routes (login, callback, etc.)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow password reset request endpoint (unauthenticated access needed)
  if (pathname === '/api/reset-requests' && req.method === 'POST') {
    return NextResponse.next()
  }

  // Allow public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow health check endpoint
  if (pathname === '/api/' || pathname === '/api') {
    return NextResponse.next()
  }

  // Protect all other API routes - require authentication
  if (pathname.startsWith('/api/')) {
    if (!req.auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // For the main page, allow access (client-side handles login redirect)
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
