import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isOwnerOrAdmin,
  safeInt,
} from '@/lib/api-utils'

// POST /api/tenants/[id]/score-override — Apply a manual score override
// Only owner/admin users may override tenant scores
// Requires: score (1-100), reason (mandatory)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can override scores
    if (!isOwnerOrAdmin(user.role)) {
      return forbiddenResponse('Only owners and admins can override tenant scores')
    }

    const { id } = await params
    const body = await request.json()
    const { score, reason } = body

    // Validate score
    if (score === undefined || score === null) {
      return errorResponse('Score is required')
    }
    const newScore = safeInt(score, -1)
    if (newScore < 0 || newScore > 100) {
      return errorResponse('Score must be between 0 and 100')
    }

    // Validate reason (mandatory)
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return errorResponse('Reason is required when applying a manual score override')
    }

    // Verify tenant exists and belongs to user's company
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    })

    if (!tenant) {
      return errorResponse('Tenant not found', 404)
    }

    const previousScore = tenant.tenantScore

    // Apply override: update tenantScore to the manual value, store override details
    // systemScore continues to be calculated independently
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tenant.update({
        where: { id },
        data: {
          tenantScore: newScore,
          manualScoreOverride: newScore,
          manualScoreReason: reason.trim(),
          manualOverrideBy: user.name,
          manualOverrideById: user.id,
          manualOverrideAt: new Date(),
        },
      })

      // Create score audit log entry
      await tx.scoreAuditLog.create({
        data: {
          tenantId: id,
          previousScore,
          newScore,
          changeType: 'MANUAL_OVERRIDE',
          changedBy: user.name,
          changedById: user.id,
          reason: reason.trim(),
          companyId: user.companyId,
        },
      })

      return result
    })

    // Also create a general audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        action: 'score_override',
        previousScore,
        newScore,
        reason: reason.trim(),
        systemScore: tenant.systemScore,
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error('Failed to apply score override:', error)
    return errorResponse('Failed to apply score override', 500)
  }
}

// DELETE /api/tenants/[id]/score-override — Remove manual override and revert to system score
// Only owner/admin users may reset scores
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can reset scores
    if (!isOwnerOrAdmin(user.role)) {
      return forbiddenResponse('Only owners and admins can reset tenant scores')
    }

    const { id } = await params

    // Verify tenant exists and belongs to user's company
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    })

    if (!tenant) {
      return errorResponse('Tenant not found', 404)
    }

    // Check if there's actually an override to remove
    if (tenant.manualScoreOverride === null) {
      return errorResponse('No manual override exists for this tenant', 400)
    }

    const previousScore = tenant.tenantScore
    const systemScore = tenant.systemScore

    // Remove override: restore tenantScore to systemScore, clear override fields
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tenant.update({
        where: { id },
        data: {
          tenantScore: systemScore,
          manualScoreOverride: null,
          manualScoreReason: null,
          manualOverrideBy: null,
          manualOverrideById: null,
          manualOverrideAt: null,
        },
      })

      // Create score audit log entry
      await tx.scoreAuditLog.create({
        data: {
          tenantId: id,
          previousScore,
          newScore: systemScore,
          changeType: 'RESET_TO_SYSTEM',
          changedBy: user.name,
          changedById: user.id,
          reason: 'Reset to system-calculated score',
          companyId: user.companyId,
        },
      })

      return result
    })

    // Also create a general audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        action: 'score_reset',
        previousScore,
        newScore: systemScore,
        reason: 'Reset to system-calculated score',
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error('Failed to reset score override:', error)
    return errorResponse('Failed to reset score override', 500)
  }
}
