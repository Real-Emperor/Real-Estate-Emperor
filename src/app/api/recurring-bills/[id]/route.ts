import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  errorResponse,
  successResponse,
  createAuditLog,
  safeDecimal,
} from '@/lib/api-utils'

// GET /api/recurring-bills/[id] — Single bill with payments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const companyId = user.companyId

    const bill = await prisma.recurringBill.findFirst({
      where: { id, companyId, isActive: true, deletedAt: null },
      include: {
        property: {
          select: { id: true, name: true, nameAr: true, nameBn: true, nameUr: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        reminders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!bill) {
      return errorResponse('Recurring bill not found', 404)
    }

    return successResponse(serialize(bill))
  } catch (error) {
    console.error('Get recurring bill error:', error)
    return errorResponse('Failed to fetch recurring bill', 500)
  }
}

// PUT /api/recurring-bills/[id] — Update bill with audit trail
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const companyId = user.companyId
    const body = await request.json()

    // Get current bill for audit trail
    const existingBill = await prisma.recurringBill.findFirst({
      where: { id, companyId, isActive: true, deletedAt: null },
    })

    if (!existingBill) {
      return errorResponse('Recurring bill not found', 404)
    }

    // Build update data
    const updateData: any = {}

    if (body.providerName !== undefined) updateData.providerName = body.providerName
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber || null
    if (body.customerNumber !== undefined) updateData.customerNumber = body.customerNumber || null
    if (body.contractNumber !== undefined) updateData.contractNumber = body.contractNumber || null
    if (body.monthlyExpectedAmount !== undefined) updateData.monthlyExpectedAmount = safeDecimal(body.monthlyExpectedAmount)
    if (body.billingFrequency !== undefined) updateData.billingFrequency = body.billingFrequency
    if (body.status !== undefined) updateData.status = body.status
    if (body.autoRenew !== undefined) updateData.autoRenew = body.autoRenew
    if (body.gracePeriodDays !== undefined) updateData.gracePeriodDays = body.gracePeriodDays
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes || null
    if (body.propertyId !== undefined) updateData.propertyId = body.propertyId
    if (body.nextDueDate !== undefined) updateData.nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : null

    // Recalculate totalAmountDue if monthlyExpectedAmount or outstanding changed
    const newMonthly = updateData.monthlyExpectedAmount !== undefined
      ? Number(updateData.monthlyExpectedAmount)
      : Number(existingBill.monthlyExpectedAmount)
    const currentOutstanding = Number(existingBill.currentOutstandingBalance)
    updateData.totalAmountDue = safeDecimal(currentOutstanding + newMonthly)

    const updatedBill = await prisma.recurringBill.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
    })

    // Create audit log with before/after snapshots
    await createAuditLog({
      action: 'UPDATE',
      entity: 'RecurringBill',
      entityId: id,
      userId: user.id,
      companyId,
      details: {
        before: {
          providerName: existingBill.providerName,
          serviceType: existingBill.serviceType,
          monthlyExpectedAmount: Number(existingBill.monthlyExpectedAmount),
          status: existingBill.status,
          billingFrequency: existingBill.billingFrequency,
        },
        after: {
          providerName: updatedBill.providerName,
          serviceType: updatedBill.serviceType,
          monthlyExpectedAmount: Number(updatedBill.monthlyExpectedAmount),
          status: updatedBill.status,
          billingFrequency: updatedBill.billingFrequency,
        },
      },
    })

    return successResponse(serialize(updatedBill))
  } catch (error) {
    console.error('Update recurring bill error:', error)
    return errorResponse('Failed to update recurring bill', 500)
  }
}

// DELETE /api/recurring-bills/[id] — Soft delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const companyId = user.companyId

    const bill = await prisma.recurringBill.findFirst({
      where: { id, companyId, isActive: true, deletedAt: null },
    })

    if (!bill) {
      return errorResponse('Recurring bill not found', 404)
    }

    await prisma.recurringBill.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    })

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entity: 'RecurringBill',
      entityId: id,
      userId: user.id,
      companyId,
      details: {
        providerName: bill.providerName,
        serviceType: bill.serviceType,
        softDelete: true,
      },
    })

    return successResponse({ message: 'Recurring bill deleted successfully' })
  } catch (error) {
    console.error('Delete recurring bill error:', error)
    return errorResponse('Failed to delete recurring bill', 500)
  }
}
