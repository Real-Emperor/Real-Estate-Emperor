import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isFinancialUser,
  safeNumber,
  safeDecimal,
} from '@/lib/api-utils'

const VALID_TYPES = ['maintenance_delay', 'flood_damage', 'utility_failure', 'goodwill', 'contract_amendment', 'owner_discount', 'other']

// PUT /api/adjustments/[id] — Edit a rent adjustment (all authenticated users can edit)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Fetch existing adjustment
    const existing = await prisma.rentAdjustment.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
            propertyId: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse('Adjustment not found', 404)
    }

    // Cannot edit cancelled adjustments
    if (existing.status === 'cancelled') {
      return errorResponse('Cannot edit a cancelled adjustment')
    }

    const body = await request.json()
    const { amount, adjustmentType, reason, notes, effectiveMonth, effectiveYear, durationMonths } = body

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {}
    if (amount !== undefined) {
      const parsedAmount = safeDecimal(amount)
      if (parsedAmount <= 0) return errorResponse('Amount must be greater than zero')
      data.amount = parsedAmount
    }
    if (adjustmentType !== undefined) {
      if (!VALID_TYPES.includes(adjustmentType)) {
        return errorResponse(`adjustmentType must be one of: ${VALID_TYPES.join(', ')}`)
      }
      data.adjustmentType = adjustmentType
    }
    if (reason !== undefined) {
      data.reason = reason
    }
    if (notes !== undefined) {
      data.notes = notes || null
    }
    if (effectiveMonth !== undefined) {
      const parsedMonth = safeNumber(effectiveMonth, 0)
      if (!parsedMonth || parsedMonth < 1 || parsedMonth > 12) return errorResponse('Invalid effectiveMonth (1-12)')
      data.effectiveMonth = parsedMonth
    }
    if (effectiveYear !== undefined) {
      const parsedYear = safeNumber(effectiveYear, 0)
      if (!parsedYear || parsedYear < 2020) return errorResponse('Invalid effectiveYear')
      data.effectiveYear = parsedYear
    }
    if (durationMonths !== undefined) {
      const parsedDuration = safeNumber(durationMonths, 1) || 1
      if (parsedDuration < 1 || parsedDuration > 12) return errorResponse('durationMonths must be between 1 and 12')
      data.durationMonths = parsedDuration
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields provided for update')
    }

    const updated = await prisma.rentAdjustment.update({
      where: { id },
      data,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
            propertyId: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Audit log with before/after snapshot
    await createAuditLog({
      action: 'UPDATE',
      entity: 'RentAdjustment',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: {
          amount: Number(existing.amount),
          adjustmentType: existing.adjustmentType,
          reason: existing.reason,
          notes: existing.notes,
          effectiveMonth: existing.effectiveMonth,
          effectiveYear: existing.effectiveYear,
          durationMonths: existing.durationMonths,
        },
        after: {
          amount: Number(updated.amount),
          adjustmentType: updated.adjustmentType,
          reason: updated.reason,
          notes: updated.notes,
          effectiveMonth: updated.effectiveMonth,
          effectiveYear: updated.effectiveYear,
          durationMonths: updated.durationMonths,
        },
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error('Error updating adjustment:', error)
    return errorResponse('Failed to update adjustment', 500)
  }
}

// DELETE /api/adjustments/[id] — Cancel/void adjustment (soft-delete by setting status to 'cancelled')
// This preserves the record for audit trail
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Fetch existing adjustment for audit
    const existing = await prisma.rentAdjustment.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse('Adjustment not found', 404)
    }

    if (existing.status === 'cancelled') {
      return errorResponse('Adjustment is already cancelled')
    }

    // Parse reason from URL query params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Adjustment cancelled'

    // Soft-delete: set status to 'cancelled'
    const updated = await prisma.rentAdjustment.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    // Audit log with full details before cancellation
    await createAuditLog({
      action: 'DELETE',
      entity: 'RentAdjustment',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        cancelledAdjustment: {
          amount: Number(existing.amount),
          adjustmentType: existing.adjustmentType,
          reason: existing.reason,
          effectiveMonth: existing.effectiveMonth,
          effectiveYear: existing.effectiveYear,
          durationMonths: existing.durationMonths,
          tenantId: existing.tenantId,
          tenantName: existing.tenant?.name,
          propertyId: existing.propertyId,
          propertyName: existing.property?.name,
        },
        cancellationReason: reason,
      },
    })

    return successResponse({ message: 'Adjustment cancelled successfully', adjustment: serialize(updated) })
  } catch (error) {
    console.error('Error cancelling adjustment:', error)
    return errorResponse('Failed to cancel adjustment', 500)
  }
}
