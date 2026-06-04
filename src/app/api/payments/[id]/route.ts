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
  isOwnerOrAdmin,
  safeNumber,
  safeDecimal,
  parseOCCVersion,
  occUpdate,
} from '@/lib/api-utils'

// PUT /api/payments/[id] — Edit a payment record (financial users only)
// Supports editing: amount, date, month, year, method, reference, notes, isLate, daysLate
// Automatically adjusts tenant score/late count when isLate status changes
// Audit trail logs before/after values
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only financial users can edit payments')
    }

    const { id } = await params

    // Fetch existing payment with tenant info
    const existing = await prisma.payment.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        tenant: {
          select: {
            id: true,
            latePaymentCount: true,
            tenantScore: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse('Payment not found', 404)
    }

    const body = await request.json()
    const { amount, date, month, year, method, reference, notes, isLate, daysLate, reason } = body

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {}
    if (amount !== undefined) {
      const parsedAmount = safeDecimal(amount)
      if (parsedAmount <= 0) return errorResponse('Amount must be greater than zero')
      data.amount = parsedAmount
    }
    if (date !== undefined) data.date = new Date(date)
    if (month !== undefined) {
      const parsedMonth = safeNumber(month, 0)
      if (!parsedMonth) return errorResponse('Invalid month')
      data.month = parsedMonth
    }
    if (year !== undefined) {
      const parsedYear = safeNumber(year, 0)
      if (!parsedYear) return errorResponse('Invalid year')
      data.year = parsedYear
    }
    if (method !== undefined) data.method = method || null
    if (reference !== undefined) data.reference = reference || null
    if (notes !== undefined) data.notes = notes || null
    if (isLate !== undefined) data.isLate = isLate === true
    if (daysLate !== undefined) data.daysLate = safeNumber(daysLate, 0)

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields provided for update')
    }

    // Handle isLate status change and tenant score adjustment in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payment.update({
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
        },
      })

      // If isLate status changed, adjust tenant score
      if (isLate !== undefined && isLate !== existing.isLate && existing.tenant) {
        const tenant = existing.tenant
        if (isLate) {
          // Changed from not-late to late: increase count, decrease score
          await tx.tenant.update({
            where: { id: tenant.id },
            data: {
              latePaymentCount: tenant.latePaymentCount + 1,
              tenantScore: Math.max(0, tenant.tenantScore - 5),
            },
          })
        } else {
          // Changed from late to not-late: decrease count, increase score
          await tx.tenant.update({
            where: { id: tenant.id },
            data: {
              latePaymentCount: Math.max(0, tenant.latePaymentCount - 1),
              tenantScore: Math.min(100, tenant.tenantScore + 5),
            },
          })
        }
      }

      return result
    })

    // Audit log with before/after snapshot
    await createAuditLog({
      action: 'UPDATE',
      entity: 'Payment',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: {
          amount: Number(existing.amount),
          date: existing.date,
          month: existing.month,
          year: existing.year,
          method: existing.method,
          isLate: existing.isLate,
          daysLate: existing.daysLate,
        },
        after: {
          amount: Number(updated.amount),
          date: updated.date,
          month: updated.month,
          year: updated.year,
          method: updated.method,
          isLate: updated.isLate,
          daysLate: updated.daysLate,
        },
        reason: reason || null,
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error('Error updating payment:', error)
    return errorResponse('Failed to update payment', 500)
  }
}

// DELETE /api/payments/[id] — Delete/reverse a payment (financial users only)
// Hard-deletes the payment record and adjusts tenant score/late count
// Audit trail preserves the deleted payment details
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only financial users can delete payments')
    }

    const { id } = await params

    // Fetch existing payment with tenant info for score adjustment and audit
    const existing = await prisma.payment.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            latePaymentCount: true,
            tenantScore: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse('Payment not found', 404)
    }

    // Parse reason from URL query params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Payment deleted'

    // Delete payment and adjust tenant score in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id },
      })

      // If the deleted payment was late, restore tenant score
      if (existing.isLate && existing.tenant) {
        const tenant = existing.tenant
        await tx.tenant.update({
          where: { id: tenant.id },
          data: {
            latePaymentCount: Math.max(0, tenant.latePaymentCount - 1),
            tenantScore: Math.min(100, tenant.tenantScore + 5),
          },
        })
      }
    })

    // Audit log with full payment details before deletion
    await createAuditLog({
      action: 'DELETE',
      entity: 'Payment',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        deletedPayment: {
          amount: Number(existing.amount),
          date: existing.date,
          month: existing.month,
          year: existing.year,
          method: existing.method,
          reference: existing.reference,
          receiptNumber: existing.receiptNumber,
          notes: existing.notes,
          isLate: existing.isLate,
          daysLate: existing.daysLate,
          tenantId: existing.tenantId,
          tenantName: existing.tenant?.name,
        },
        reason,
      },
    })

    return successResponse({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return errorResponse('Failed to delete payment', 500)
  }
}
