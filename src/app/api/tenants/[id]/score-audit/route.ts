import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'

// GET /api/tenants/[id]/score-audit — Get the score audit trail for a tenant
// All authenticated users can view the audit trail (read-only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Verify tenant exists and belongs to user's company
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!tenant) {
      return errorResponse('Tenant not found', 404)
    }

    // Fetch score audit logs, most recent first
    const auditLogs = await prisma.scoreAuditLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent entries
    })

    return successResponse(auditLogs.map(serialize))
  } catch (error) {
    console.error('Failed to fetch score audit trail:', error)
    return errorResponse('Failed to fetch score audit trail', 500)
  }
}
