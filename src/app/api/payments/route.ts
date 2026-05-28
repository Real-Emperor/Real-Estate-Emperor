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

// GET /api/payments — list all payments with optional filters
// Query params: ?month=X&year=Y&tenantId=Z
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  // Staff can record payments but only owner/admin can view financial details
  if (!isFinancialUser(user.role)) {
    return forbiddenResponse('Only owners and admins can view payment records')
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const tenantId = searchParams.get('tenantId')

    const where: any = {}

    if (month) where.month = Number(month)
    if (year) where.year = Number(year)
    if (tenantId) where.tenantId = tenantId

    // If not admin, scope to the user's company tenants
    if (user.role !== 'admin') {
      where.tenant = { companyId: user.companyId }
    }

    const payments = await prisma.payment.findMany({
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
    })

    return successResponse(payments.map(serialize))
  } catch (error) {
    console.error('Error fetching payments:', error)
    return errorResponse('Failed to fetch payments', 500)
  }
}

// POST /api/payments — create a new payment
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  // Staff can record payments
  try {
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

    // Verify the tenant belongs to the user's company
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: user.companyId },
    })
    if (!tenant) {
      return errorResponse('Tenant not found or does not belong to your company', 404)
    }

    const parsedIsLate = isLate === true
    const parsedDaysLate = parsedIsLate ? Number(daysLate) || 0 : 0

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        amount: Number(amount),
        date: new Date(date),
        month: Number(month),
        year: Number(year),
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

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          latePaymentCount: newLatePaymentCount,
          tenantScore: newTenantScore,
        },
      })
    }

    // Audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        amount: Number(amount),
        tenantId,
        month: Number(month),
        year: Number(year),
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
