import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
} from '@/lib/api-utils'

// POST /api/company/reset — Soft-delete all company data (admin only)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only admin can reset company data
    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can reset company data')
    }

    const body = await request.json()

    // Require confirmation
    if (body.confirmation !== 'RESET_ALL_DATA') {
      return errorResponse('Confirmation required. Send { confirmation: "RESET_ALL_DATA" } to confirm.')
    }

    const companyId = user.companyId
    const now = new Date()

    // Count records before deletion for the summary
    const [
      propertyCount,
      tenantCount,
      expenseCount,
      maintenanceCount,
      auditLogCount,
    ] = await Promise.all([
      prisma.property.count({ where: { companyId, deletedAt: null } }),
      prisma.tenant.count({ where: { companyId, deletedAt: null } }),
      prisma.expense.count({ where: { companyId, deletedAt: null } }),
      prisma.maintenance.count({ where: { companyId, deletedAt: null } }),
      prisma.auditLog.count({ where: { companyId } }),
    ])

    // Get all active tenant IDs for payment deletion
    const activeTenants = await prisma.tenant.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true },
    })
    const tenantIds = activeTenants.map(t => t.id)
    const paymentCount = tenantIds.length > 0
      ? await prisma.payment.count({ where: { tenantId: { in: tenantIds } } })
      : 0

    // Delete payments first (they cascade on tenant delete, but we need to count)
    if (tenantIds.length > 0) {
      await prisma.payment.deleteMany({ where: { tenantId: { in: tenantIds } } })
    }

    // Soft-delete all company data
    await Promise.all([
      prisma.maintenance.updateMany({
        where: { companyId, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.expense.updateMany({
        where: { companyId, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.tenant.updateMany({
        where: { companyId, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.property.updateMany({
        where: { companyId, deletedAt: null },
        data: { deletedAt: now },
      }),
    ])

    // Delete audit logs (they don't have soft delete)
    await prisma.auditLog.deleteMany({
      where: { companyId },
    })

    // Create audit log entry for the reset (without companyId to avoid it being deleted)
    await prisma.auditLog.create({
      data: {
        action: 'DATA_RESET',
        entity: 'Company',
        entityId: companyId,
        userId: user.id,
        companyId,
        details: JSON.stringify({
          resetBy: user.email,
          deletedCounts: {
            properties: propertyCount,
            tenants: tenantCount,
            payments: paymentCount,
            expenses: expenseCount,
            maintenance: maintenanceCount,
            auditLogs: auditLogCount,
          },
        }),
      },
    })

    return successResponse({
      message: 'All company data has been reset successfully',
      deletedCounts: {
        properties: propertyCount,
        tenants: tenantCount,
        payments: paymentCount,
        expenses: expenseCount,
        maintenance: maintenanceCount,
        auditLogs: auditLogCount,
      },
    })
  } catch (error) {
    console.error('Company reset error:', error)
    return errorResponse('Failed to reset company data', 500)
  }
}
