import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'Al Reef Al Madeena Real Estate Management and General Maintenance - L.L.C - S.P.C' })
}
