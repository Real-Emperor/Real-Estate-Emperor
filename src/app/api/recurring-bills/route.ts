import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  errorResponse,
  successResponse,
  createAuditLog,
  safeDecimal,
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'

// GET /api/recurring-bills — List all recurring bills for the company
// Status filter is derived from the LATEST cycle's status, not the bill's top-level status
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const companyId = user.companyId
    const { searchParams } = new URL(request.url)

    // Filters
    const status = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')
    const serviceType = searchParams.get('serviceType')
    const search = searchParams.get('search')

    // Pagination
    const pagination = parsePaginationParams(searchParams)

    // Build where clause — do NOT filter by status at DB level
    // because the bill's top-level status may be stale; we filter in JS after deriving from cycles
    const where: any = {
      companyId,
      isActive: true,
      deletedAt: null,
    }

    if (propertyId) where.propertyId = propertyId
    if (serviceType) where.serviceType = serviceType
    if (search) {
      where.OR = [
        { providerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch ALL matching bills (no status filter at DB level) with their latest cycle
    // We'll apply status filter in JS after deriving from cycle
    const allBills = await prisma.recurringBill.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, nameAr: true, nameBn: true, nameUr: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 5,
        },
        cycles: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { nextDueDate: 'asc' },
    })

    // Derive effective status from latest cycle for each bill
    const enrichedBills = allBills.map(bill => {
      const latestCycle = bill.cycles?.[0] // cycles are ordered desc, so first is latest
      const effectiveStatus = latestCycle?.status || bill.status
      return {
        ...serialize(bill),
        effectiveStatus,
        latestCycle: latestCycle ? serialize(latestCycle) : null,
      }
    })

    // Apply status filter in JS using effectiveStatus
    let filteredBills = enrichedBills
    if (status) {
      filteredBills = enrichedBills.filter(b => b.effectiveStatus === status)
    }

    const total = filteredBills.length

    // Apply pagination in JS
    const paginatedBills = filteredBills.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    )

    return paginatedResponse(paginatedBills, total, pagination)
  } catch (error) {
    console.error('Recurring bills list error:', error)
    return errorResponse('Failed to fetch recurring bills', 500)
  }
}

// POST /api/recurring-bills — Create a new recurring bill
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const companyId = user.companyId
    const body = await request.json()

    // Validate required fields
    if (!body.propertyId || !body.providerName || !body.serviceType || !body.monthlyExpectedAmount) {
      return errorResponse('Missing required fields: propertyId, providerName, serviceType, monthlyExpectedAmount')
    }

    // Validate property belongs to company
    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, companyId, deletedAt: null },
    })
    if (!property) {
      return errorResponse('Property not found or does not belong to your company', 404)
    }

    const monthlyExpectedAmount = safeDecimal(body.monthlyExpectedAmount)
    const currentOutstandingBalance = safeDecimal(body.currentOutstandingBalance || 0)
    const totalAmountDue = monthlyExpectedAmount + currentOutstandingBalance

    const bill = await prisma.recurringBill.create({
      data: {
        companyId,
        propertyId: body.propertyId,
        providerName: body.providerName,
        serviceType: body.serviceType,
        accountNumber: body.accountNumber || null,
        customerNumber: body.customerNumber || null,
        contractNumber: body.contractNumber || null,
        monthlyExpectedAmount,
        currentOutstandingBalance,
        previousOutstandingBalance: 0,
        totalAmountDue,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        billingFrequency: body.billingFrequency || 'monthly',
        status: 'pending',
        autoRenew: body.autoRenew || false,
        gracePeriodDays: body.gracePeriodDays || 0,
        internalNotes: body.internalNotes || null,
        // Auto-create the first billing cycle
        cycles: {
          create: {
            companyId,
            periodStart: new Date(),
            periodEnd: body.nextDueDate ? new Date(body.nextDueDate) : new Date(),
            dueDate: body.nextDueDate ? new Date(body.nextDueDate) : new Date(),
            amount: monthlyExpectedAmount,
            paidAmount: 0,
            outstandingAmount: monthlyExpectedAmount,
            status: 'pending',
            cycleNumber: 1,
          },
        },
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        cycles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'RecurringBill',
      entityId: bill.id,
      userId: user.id,
      companyId,
      details: {
        providerName: bill.providerName,
        serviceType: bill.serviceType,
        monthlyExpectedAmount: Number(bill.monthlyExpectedAmount),
        propertyId: bill.propertyId,
      },
    })

    return successResponse(serialize(bill), 201)
  } catch (error) {
    console.error('Create recurring bill error:', error)
    return errorResponse('Failed to create recurring bill', 500)
  }
}
