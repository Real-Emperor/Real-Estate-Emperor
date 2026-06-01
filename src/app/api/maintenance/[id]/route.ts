import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isSystemAdmin,
  isOwnerOrAdmin,
  safeNumber,
  safeDecimal,
  parseOCCVersion,
  occUpdate,
  validatePropertyOwnership,
} from '@/lib/api-utils'

// PUT /api/maintenance/[id] - Update a maintenance item
// PHASE 2: RBAC — owner/admin can update all fields; staff can only update status
// PHASE 2: Validate propertyId ownership if changed; OCC for concurrency
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await prisma.maintenance.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
    })

    if (!existing) {
      return errorResponse('Maintenance item not found', 404)
    }

    const body = await request.json()
    const { title, description, category, vendor, priority, status, propertyId, estimatedCost, actualCost, completedAt } = body

    // PHASE 2: RBAC — staff can only update status field
    if (!isOwnerOrAdmin(user.role)) {
      // Staff: only status changes allowed
      const allowedFields = ['status', 'updatedAt', '_updatedAt']
      const providedFields = Object.keys(body).filter(k => !allowedFields.includes(k))
      if (providedFields.length > 0) {
        return forbiddenResponse('Staff can only update the status of maintenance items')
      }
      if (!status) {
        return errorResponse('Staff can only update the status field')
      }
    }

    // PHASE 2: Validate propertyId ownership if being changed
    if (propertyId !== undefined && propertyId !== existing.propertyId) {
      const propResult = await validatePropertyOwnership(propertyId, user.companyId)
      if (propResult instanceof Response) return propResult
    }

    // When status changes to completed, set completedAt if not provided
    let resolvedCompletedAt = completedAt ? new Date(completedAt) : existing.completedAt
    if (status === 'completed' && existing.status !== 'completed' && !resolvedCompletedAt) {
      resolvedCompletedAt = new Date()
    }

    // NaN guards for costs (PHASE 3: safeDecimal for monetary precision)
    const parsedEstimatedCost = estimatedCost !== undefined
      ? (estimatedCost ? safeDecimal(estimatedCost) : null)
      : existing.estimatedCost
    const parsedActualCost = actualCost !== undefined
      ? (actualCost ? safeDecimal(actualCost) : null)
      : existing.actualCost

    // Build update data
    const data: Record<string, unknown> = {}

    if (isOwnerOrAdmin(user.role)) {
      // Full update for owner/admin
      if (title !== undefined) data.title = title
      if (description !== undefined) data.description = description
      if (category !== undefined) data.category = category
      if (vendor !== undefined) data.vendor = vendor
      if (priority !== undefined) data.priority = priority
      if (estimatedCost !== undefined) data.estimatedCost = parsedEstimatedCost
      if (actualCost !== undefined) data.actualCost = parsedActualCost
      if (propertyId !== undefined) data.propertyId = propertyId
    }
    // Both roles can update status
    if (status !== undefined) {
      data.status = status
      data.completedAt = status === 'completed' ? resolvedCompletedAt : (status && status !== 'completed' ? null : existing.completedAt)
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields provided for update')
    }

    // PHASE 2: Use OCC-protected update
    const occVersion = parseOCCVersion(body)

    const updated = await occUpdate(
      prisma.maintenance,
      id,
      occVersion,
      data,
      { companyId: user.companyId, deletedAt: null }
    )

    if (updated instanceof Response) return updated

    // Fetch with property relation for response
    const fullUpdated = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Maintenance',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: { status: existing.status, priority: existing.priority, title: existing.title },
        after: fullUpdated ? { status: fullUpdated.status, priority: fullUpdated.priority, title: fullUpdated.title } : null,
        occProtected: !!occVersion,
      },
    })

    if (!fullUpdated) {
      return errorResponse('Failed to fetch updated maintenance item', 500)
    }

    return successResponse(serialize(fullUpdated))
  } catch (error) {
    console.error('Error updating maintenance item:', error)
    return errorResponse('Failed to update maintenance item', 500)
  }
}

// DELETE /api/maintenance/[id] - Soft delete a maintenance item (owner/admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner or admin can delete
    if (user.role !== 'owner' && !isSystemAdmin(user.role)) {
      return forbiddenResponse('Only owners or admins can delete maintenance items')
    }

    const { id } = await params

    const existing = await prisma.maintenance.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
    })

    if (!existing) {
      return errorResponse('Maintenance item not found', 404)
    }

    await prisma.maintenance.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog({
      action: 'DELETE',
      entity: 'Maintenance',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: { title: existing.title, softDelete: true },
    })

    return successResponse({ message: 'Maintenance item deleted successfully' })
  } catch (error) {
    console.error('Error deleting maintenance item:', error)
    return errorResponse('Failed to delete maintenance item', 500)
  }
}
