import prisma from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
  safeNumber,
} from '@/lib/api-utils'

// GET /api/system/stats — System statistics for admin dashboard
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only admin can view system stats
    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can view system stats')
    }

    const companyId = user.companyId
    const startTime = Date.now()

    // Total record counts per entity
    const [
      propertyCount,
      tenantCount,
      paymentCount,
      expenseCount,
      maintenanceCount,
      userCount,
      reservationCount,
      receiptCount,
      auditLogCount,
      backupRecordCount,
    ] = await Promise.all([
      prisma.property.count({ where: { companyId } }),
      prisma.tenant.count({ where: { companyId } }),
      prisma.payment.count({ where: { tenant: { companyId } } }),
      prisma.expense.count({ where: { companyId } }),
      prisma.maintenance.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } }),
      prisma.reservation.count({ where: { companyId } }),
      prisma.receipt.count({ where: { companyId } }),
      prisma.auditLog.count({ where: { companyId } }),
      prisma.backupRecord.count({ where: { companyId } }),
    ])

    // Active users count
    const activeUsers = await prisma.user.count({
      where: { companyId, isActive: true },
    })

    // Recent login activity (last 24h)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1)

    const recentLogins = await prisma.auditLog.count({
      where: {
        companyId,
        action: 'LOGIN',
        createdAt: { gte: twentyFourHoursAgo },
      },
    })

    // Backup status
    const [
      lastBackup,
      successfulBackups,
      failedBackups,
    ] = await Promise.all([
      prisma.backupRecord.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          status: true,
          type: true,
          size: true,
          recordCount: true,
          dataHash: true,
          storageUrl: true,
        },
      }),
      prisma.backupRecord.count({
        where: { companyId, status: 'completed' },
      }),
      prisma.backupRecord.count({
        where: { companyId, status: 'failed' },
      }),
    ])

    // Health check — database connectivity
    let dbStatus = 'healthy'
    let dbLatency = 0
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - dbStart
      if (dbLatency > 1000) {
        dbStatus = 'degraded'
      }
    } catch {
      dbStatus = 'unhealthy'
    }

    // Uptime (process uptime in seconds)
    const uptimeSeconds = Math.floor(process.uptime())

    const checkDuration = Date.now() - startTime

    return successResponse({
      recordCounts: {
        properties: propertyCount,
        tenants: tenantCount,
        payments: paymentCount,
        expenses: expenseCount,
        maintenance: maintenanceCount,
        users: userCount,
        reservations: reservationCount,
        receipts: receiptCount,
        auditLogs: auditLogCount,
        backupRecords: backupRecordCount,
      },
      activeUsers,
      recentLogins,
      backup: {
        lastBackup: lastBackup ? {
          createdAt: lastBackup.createdAt.toISOString(),
          status: lastBackup.status,
          type: lastBackup.type,
          size: lastBackup.size,
          recordCount: lastBackup.recordCount,
          dataHash: lastBackup.dataHash,
          storageUrl: lastBackup.storageUrl,
        } : null,
        successfulBackups,
        failedBackups,
      },
      health: {
        database: dbStatus,
        dbLatencyMs: dbLatency,
      },
      uptimeSeconds,
      checkDurationMs: checkDuration,
    })
  } catch (error) {
    console.error('System stats error:', error)
    return errorResponse('Failed to fetch system stats', 500)
  }
}
