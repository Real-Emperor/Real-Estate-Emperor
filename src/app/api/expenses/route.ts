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
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'

// GET /api/expenses — list expenses with pagination (non-deleted) for the company
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // All authenticated users can view expenses (staff need visibility for their submissions)
    // Staff see all expenses but cannot edit/delete them

    const { searchParams } = new URL(request.url)
    const pagination = parsePaginationParams(searchParams)
    const category = searchParams.get('category')?.trim() || undefined

    const where: any = {
      companyId: user.companyId,
      deletedAt: null, // exclude soft-deleted
    }

    if (category) where.category = category

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.expense.count({ where }),
    ])

    return successResponse(paginatedResponse(expenses.map(serialize), total, pagination))
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return errorResponse('Failed to fetch expenses', 500)
  }
}

// POST /api/expenses — create a new expense
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // All authenticated users can create expenses
    // Staff submit expenses for maintenance, supplies, operations, etc.
    // Only owner/admin can edit/delete (handled in PUT/DELETE routes)

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

    // PHASE 3: Use safeDecimal for monetary precision
    const parsedAmount = safeDecimal(amount)
    if (parsedAmount <= 0) return errorResponse('amount must be greater than zero')

    const expense = await prisma.expense.create({
      data: {
        companyId: user.companyId,
        category,
        description,
        amount: parsedAmount,
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
        amount: parsedAmount,
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
