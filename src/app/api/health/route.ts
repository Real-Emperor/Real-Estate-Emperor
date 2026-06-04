import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// PHASE 3: Health check endpoint for monitoring and uptime checks
// Unauthenticated — allowed through middleware for Kubernetes/Datadog/uptime monitors
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {}

  // 1. Database connectivity check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  // 2. Environment check
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])
  checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
    ...(missingEnvVars.length > 0 && { error: `Missing: ${missingEnvVars.join(', ')}` }),
  }

  // 3. Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy')
  const anyUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy')

  const overallStatus = anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    totalLatencyMs: Date.now() - startTime,
    checks,
  }

  return NextResponse.json(response, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
  })
}
