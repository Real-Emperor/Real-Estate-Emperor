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
  parseOCCVersion,
  occUpdate,
} from '@/lib/api-utils'

// PUT /api/expenses/[id] — update an existing expense (owner/admin only + OCC)
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

    // PHASE 2: Optimistic Concurrency Control
    const occVersion = parseOCCVersion(body)

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

    // PHASE 3: Use safeDecimal for monetary precision
    const parsedAmount = amount !== undefined ? safeDecimal(amount) : undefined
    if (parsedAmount !== undefined && parsedAmount <= 0) {
      return errorResponse('amount must be greater than zero')
    }

    // Build update data
    const data: Record<string, unknown> = {}
    if (category !== undefined) data.category = category
    if (description !== undefined) data.description = description
    if (parsedAmount !== undefined) data.amount = parsedAmount
    if (date !== undefined) data.date = new Date(date)
    if (vendor !== undefined) data.vendor = vendor || null
    if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber || null
    if (recurring !== undefined) data.recurring = recurring === true
    if (building !== undefined) data.building = building || null

    // PHASE 2: Use OCC-protected update
    const updated = await occUpdate(
      prisma.expense,
      id,
      occVersion,
      data,
      { companyId: user.companyId, deletedAt: null }
    )

    if (updated instanceof Response) return updated

    // Fetch with company relation for response
    const fullExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!fullExpense) {
      return errorResponse('Failed to fetch updated expense', 500)
    }

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
          category: fullExpense.category,
          description: fullExpense.description,
          amount: fullExpense.amount,
          vendor: fullExpense.vendor,
          invoiceNumber: fullExpense.invoiceNumber,
          recurring: fullExpense.recurring,
          building: fullExpense.building,
        },
        occProtected: !!occVersion,
      },
    })

    return successResponse(serialize(fullExpense))
  } catch (error) {
    console.error('Error updating expense:', error)
    return errorResponse('Failed to update expense', 500)
  }
}

// DELETE /api/expenses/[id] — soft delete an expense (owner/admin only)
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
