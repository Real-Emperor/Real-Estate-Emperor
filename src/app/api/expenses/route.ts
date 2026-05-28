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
} from '@/lib/api-utils'

// GET /api/expenses — list all expenses (non-deleted) for the company
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  // Only owner/admin can access expenses
  if (!isFinancialUser(user.role)) {
    return forbiddenResponse('Only owners and admins can view expenses')
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        deletedAt: null, // exclude soft-deleted
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return successResponse(expenses.map(serialize))
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return errorResponse('Failed to fetch expenses', 500)
  }
}

// POST /api/expenses — create a new expense
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  // Only owner/admin can create expenses
  if (!isFinancialUser(user.role)) {
    return forbiddenResponse('Only owners and admins can create expenses')
  }

  try {
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

    // Validate required fields
    if (!category) return errorResponse('category is required')
    if (!description) return errorResponse('description is required')
    if (amount === undefined || amount === null) return errorResponse('amount is required')
    if (!date) return errorResponse('date is required')

    const expense = await prisma.expense.create({
      data: {
        companyId: user.companyId,
        category,
        description,
        amount: Number(amount),
        date: new Date(date),
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        recurring: recurring === true,
        building: building || null,
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
      action: 'CREATE',
      entity: 'Expense',
      entityId: expense.id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        category,
        description,
        amount: Number(amount),
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        recurring: recurring === true,
        building: building || null,
      },
    })

    return successResponse(serialize(expense), 201)
  } catch (error) {
    console.error('Error creating expense:', error)
    return errorResponse('Failed to create expense', 500)
  }
}
