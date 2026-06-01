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
} from '@/lib/api-utils'

// PUT /api/expenses/[id] — update an existing expense
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can update expenses
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can update expenses')
    }

    const { id } = await params

    // Verify expense exists and belongs to user's company
    const existing = await prisma.expense.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Expense not found', 404)
    }

    const body = await request.json()

    const {
      category,
      description,
      amount,
      date,
      vendor,
      invoiceNumber,
      recurring,
      building,
    } = body

    // NaN guard for amount if provided
    const parsedAmount = amount !== undefined ? safeNumber(amount, -1) : undefined
    if (parsedAmount !== undefined && parsedAmount <= 0) {
      return errorResponse('amount must be greater than zero')
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(parsedAmount !== undefined && { amount: parsedAmount }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(vendor !== undefined && { vendor: vendor || null }),
        ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber || null }),
        ...(recurring !== undefined && { recurring: recurring === true }),
        ...(building !== undefined && { building: building || null }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'Expense',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(existing),
        after: {
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          vendor: expense.vendor,
          invoiceNumber: expense.invoiceNumber,
          recurring: expense.recurring,
          building: expense.building,
        },
      },
    })

    return successResponse(serialize(expense))
  } catch (error) {
    console.error('Error updating expense:', error)
    return errorResponse('Failed to update expense', 500)
  }
}

// DELETE /api/expenses/[id] — soft delete an expense
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can delete expenses
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can delete expenses')
    }

    const { id } = await params

    // Verify expense exists and belongs to user's company
    const existing = await prisma.expense.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
    })
    if (!existing) {
      return errorResponse('Expense not found', 404)
    }

    // Soft delete by setting deletedAt
    const expense = await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Audit log
    await createAuditLog({
      action: 'DELETE',
      entity: 'Expense',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        softDelete: true,
        category: existing.category,
        description: existing.description,
        amount: existing.amount,
      },
    })

    return successResponse({ message: 'Expense deleted successfully', id })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return errorResponse('Failed to delete expense', 500)
  }
}
