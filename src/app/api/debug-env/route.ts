import { NextResponse } from 'next/server'

export async function GET() {
  const cronSecret = process.env.CRON_SECRET
  return NextResponse.json({
    hasCronSecret: !!cronSecret,
    cronSecretLength: cronSecret?.length || 0,
    cronSecretFirst8: cronSecret?.substring(0, 8) || 'NOT_SET',
    cronSecretLast8: cronSecret?.slice(-8) || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
  })
}
