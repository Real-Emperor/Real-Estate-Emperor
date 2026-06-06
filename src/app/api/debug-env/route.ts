import { NextResponse } from 'next/server'

// DEBUG ENDPOINT DISABLED — this route exposed sensitive environment data in production.
// If needed for local debugging, temporarily re-enable with proper auth guards.
export async function GET() {
  return NextResponse.json({ error: 'This endpoint is disabled' }, { status: 404 })
}
