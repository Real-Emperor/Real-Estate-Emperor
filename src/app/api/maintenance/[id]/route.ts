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
  safeNumber,
} from '@/lib/api-utils'

// PUT /api/maintenance/[id] - Update a maintenance item
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

    // When status changes to completed, set completedAt if not provided
    let resolvedCompletedAt = completedAt ? new Date(completedAt) : existing.completedAt
    if (status === 'completed' && existing.status !== 'completed' && !resolvedCompletedAt) {
      resolvedCompletedAt = new Date()
    }

    // NaN guards for costs
    const parsedEstimatedCost = estimatedCost !== undefined
      ? (estimatedCost ? safeNumber(estimatedCost) : null)
      : existing.estimatedCost
    const parsedActualCost = actualCost !== undefined
      ? (actualCost ? safeNumber(actualCost) : null)
      : existing.actualCost

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        category: category !== undefined ? category : existing.category,
        vendor: vendor !== undefined ? vendor : existing.vendor,
        priority: priority ?? existing.priority,
        status: status ?? existing.status,
        propertyId: propertyId !== undefined ? propertyId : existing.propertyId,
        estimatedCost: parsedEstimatedCost,
        actualCost: parsedActualCost,
        completedAt: status === 'completed' ? resolvedCompletedAt : (status && status !== 'completed' ? null : existing.completedAt),
      },
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
        after: { status: updated.status, priority: updated.priority, title: updated.title },
      },
    })

    return successResponse(serialize(updated))
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
