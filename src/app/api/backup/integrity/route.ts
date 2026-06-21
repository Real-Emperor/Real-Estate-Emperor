import prisma from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
  safeNumber,
} from '@/lib/api-utils'

// GET /api/backup/integrity — Verify data integrity of the current database
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can run integrity checks
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbiddenResponse('Only owners and admins can run integrity checks')
    }

    const companyId = user.companyId
    const startTime = Date.now()

    // Record counts for all entity types
    const [
      propertyCount,
      tenantCount,
      paymentCount,
      expenseCount,
      maintenanceCount,
      userCount,
    ] = await Promise.all([
      prisma.property.count({ where: { companyId, deletedAt: null } }),
      prisma.tenant.count({ where: { companyId, deletedAt: null } }),
      prisma.payment.count({ where: { tenant: { companyId } } }),
      prisma.expense.count({ where: { companyId, deletedAt: null } }),
      prisma.maintenance.count({ where: { companyId, deletedAt: null } }),
      prisma.user.count({ where: { companyId } }),
    ])

    // Financial totals
    const [totalRentResult, totalPaymentsResult, totalExpensesResult] = await Promise.all([
      prisma.tenant.aggregate({
        where: { companyId, deletedAt: null, status: 'active' },
        _sum: { rentAmount: true },
      }),
      prisma.payment.aggregate({
        where: { tenant: { companyId } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { amount: true },
      }),
    ])

    const totalRent = safeNumber(totalRentResult._sum.rentAmount)
    const totalPayments = safeNumber(totalPaymentsResult._sum.amount)
    const totalExpenses = safeNumber(totalExpensesResult._sum.amount)
    const totalOutstanding = Math.max(0, totalRent - totalPayments)

    // Orphan detection
    const orphanTenants = await prisma.tenant.count({
      where: {
        companyId,
        deletedAt: null,
        property: { deletedAt: { not: null } },
      },
    })

    const orphanPayments = await prisma.payment.count({
      where: {
        tenant: { companyId },
        tenantId: { notIn: (await prisma.tenant.findMany({ where: { companyId }, select: { id: true } })).map(t => t.id) },
      },
    })

    // Soft-deleted record counts
    const [
      deletedPropertyCount,
      deletedTenantCount,
      deletedExpenseCount,
      deletedMaintenanceCount,
    ] = await Promise.all([
      prisma.property.count({ where: { companyId, deletedAt: { not: null } } }),
      prisma.tenant.count({ where: { companyId, deletedAt: { not: null } } }),
      prisma.expense.count({ where: { companyId, deletedAt: { not: null } } }),
      prisma.maintenance.count({ where: { companyId, deletedAt: { not: null } } }),
    ])

    // Last backup timestamp and status
    const lastBackup = await prisma.backupRecord.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, status: true, type: true, dataHash: true },
    })

    // Database connectivity latency
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    const checkDuration = Date.now() - startTime

    const hasOrphans = orphanTenants > 0 || orphanPayments > 0

    return successResponse({
      recordCounts: {
        properties: propertyCount,
        tenants: tenantCount,
        payments: paymentCount,
        expenses: expenseCount,
        maintenance: maintenanceCount,
        users: userCount,
      },
      financials: {
        totalRent,
        totalPayments,
        totalExpenses,
        totalOutstanding,
      },
      orphans: {
        tenantsWithoutValidProperty: orphanTenants,
        paymentsWithoutValidTenant: orphanPayments,
        hasOrphans,
      },
      softDeleted: {
        properties: deletedPropertyCount,
        tenants: deletedTenantCount,
        expenses: deletedExpenseCount,
        maintenance: deletedMaintenanceCount,
        total: deletedPropertyCount + deletedTenantCount + deletedExpenseCount + deletedMaintenanceCount,
      },
      lastBackup: lastBackup ? {
        createdAt: lastBackup.createdAt.toISOString(),
        status: lastBackup.status,
        type: lastBackup.type,
        dataHash: lastBackup.dataHash,
      } : null,
      dbLatencyMs: dbLatency,
      checkDurationMs: checkDuration,
      overallStatus: hasOrphans ? 'warning' : 'healthy',
    })
  } catch (error) {
    console.error('Integrity check error:', error)
    return errorResponse('Failed to run integrity check', 500)
  }
}
