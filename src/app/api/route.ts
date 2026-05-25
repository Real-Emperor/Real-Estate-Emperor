import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.' })
}
