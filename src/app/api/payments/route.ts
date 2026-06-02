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

// GET /api/payments — list payments with pagination (scoped to user's company)
// Query params: ?month=X&year=Y&tenantId=Z&page=N&limit=N
// Staff can view payments but amounts are masked (set to 0) for non-financial users
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const financialAccess = isFinancialUser(user.role)

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const tenantId = searchParams.get('tenantId')
    const pagination = parsePaginationParams(searchParams)

    const where: any = {
      companyId: user.companyId, // Direct company reference — no JOIN needed
    }

    if (month) where.month = safeNumber(month, 0) || undefined
    if (year) where.year = safeNumber(year, 0) || undefined
    if (tenantId) where.tenantId = tenantId

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
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
        orderBy: { date: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.payment.count({ where }),
    ])

    // Mask amounts for non-financial users (staff) — they can see payment records but not amounts
    const serializedPayments = payments.map(serialize)
    const mappedPayments = financialAccess
      ? serializedPayments
      : serializedPayments.map((p: any) => ({ ...p, amount: 0 }))

    return successResponse(paginatedResponse(mappedPayments, total, pagination))
  } catch (error) {
    console.error('Error fetching payments:', error)
    return errorResponse('Failed to fetch payments', 500)
  }
}

// POST /api/payments — create a new payment
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const {
      tenantId,
      amount,
      date,
      month,
      year,
      method,
      reference,
      receiptNumber,
      notes,
      isLate,
      daysLate,
    } = body

    // Validate required fields
    if (!tenantId) return errorResponse('tenantId is required')
    if (amount === undefined || amount === null) return errorResponse('amount is required')
    if (!date) return errorResponse('date is required')
    if (month === undefined || month === null) return errorResponse('month is required')
    if (year === undefined || year === null) return errorResponse('year is required')

    // PHASE 3: Use safeDecimal for monetary precision
    const parsedAmount = safeDecimal(amount)
    if (parsedAmount <= 0) return errorResponse('amount must be greater than zero')
    const parsedMonth = safeNumber(month, 0)
    const parsedYear = safeNumber(year, 0)
    if (!parsedMonth || !parsedYear) return errorResponse('Invalid month or year')

    // Verify the tenant belongs to the user's company
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: user.companyId, deletedAt: null },
    })
    if (!tenant) {
      return errorResponse('Tenant not found or does not belong to your company', 404)
    }

    const parsedIsLate = isLate === true
    const parsedDaysLate = parsedIsLate ? safeNumber(daysLate, 0) : 0

    // PHASE 1 FIX: Wrap multi-step operation in transaction
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          companyId: user.companyId,
          tenantId,
          amount: parsedAmount,
          date: new Date(date),
          month: parsedMonth,
          year: parsedYear,
          method: method || null,
          reference: reference || null,
          receiptNumber: receiptNumber || null,
          notes: notes || null,
          isLate: parsedIsLate,
          daysLate: parsedDaysLate,
        },
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

      // If late payment, update tenant's latePaymentCount and tenantScore
      if (parsedIsLate) {
        const newLatePaymentCount = tenant.latePaymentCount + 1
        const newTenantScore = Math.max(0, tenant.tenantScore - 5)

        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            latePaymentCount: newLatePaymentCount,
            tenantScore: newTenantScore,
          },
        })
      }

      return created
    })

    // Audit log (outside transaction — should not rollback payment on audit failure)
    await createAuditLog({
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        amount: parsedAmount,
        tenantId,
        month: parsedMonth,
        year: parsedYear,
        isLate: parsedIsLate,
        daysLate: parsedDaysLate,
      },
    })

    return successResponse(serialize(payment), 201)
  } catch (error) {
    console.error('Error creating payment:', error)
    return errorResponse('Failed to create payment', 500)
  }
}
