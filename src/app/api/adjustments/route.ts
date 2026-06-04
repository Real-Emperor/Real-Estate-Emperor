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

// GET /api/adjustments — list adjustments with pagination (scoped to user's company)
// Query params: ?month=X&year=Y&tenantId=Z&status=approved&page=N&limit=N
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const financialAccess = isFinancialUser(user.role)

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const pagination = parsePaginationParams(searchParams)

    const where: any = {
      companyId: user.companyId,
    }

    if (tenantId) where.tenantId = tenantId
    if (status) where.status = status

    // Filter by effective month/year
    if (month && year) {
      const m = safeNumber(month, 0)
      const y = safeNumber(year, 0)
      if (m && y) {
        // Find adjustments that cover this month:
        // effectiveMonth/effectiveYear + durationMonths must span the requested month
        where.AND = [
          {
            OR: [
              // Single-month adjustments
              { effectiveMonth: m, effectiveYear: y, durationMonths: 1 },
              // Multi-month adjustments that span this month
              {
                durationMonths: { gt: 1 },
                OR: Array.from({ length: 12 }, (_, i) => {
                  // Calculate start month for adjustments that would cover month m/year y
                  let startM = m - i
                  let startY = y
                  while (startM <= 0) { startM += 12; startY -= 1 }
                  return { effectiveMonth: startM, effectiveYear: startY }
                }),
              },
            ],
          },
        ]
      }
    }

    const [adjustments, total] = await Promise.all([
      prisma.rentAdjustment.findMany({
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
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.rentAdjustment.count({ where }),
    ])

    // Mask amounts for non-financial users
    const serializedAdjustments = adjustments.map(serialize)
    const mappedAdjustments = financialAccess
      ? serializedAdjustments
      : serializedAdjustments.map((a: any) => ({ ...a, amount: 0 }))

    return successResponse(paginatedResponse(mappedAdjustments, total, pagination))
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return errorResponse('Failed to fetch adjustments', 500)
  }
}

// POST /api/adjustments — create a new rent adjustment
// All authenticated users can create adjustments
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const {
      tenantId,
      propertyId,
      amount,
      adjustmentType,
      reason,
      notes,
      effectiveMonth,
      effectiveYear,
      durationMonths,
    } = body

    // Validate required fields
    if (!tenantId) return errorResponse('tenantId is required')
    if (!propertyId) return errorResponse('propertyId is required')
    if (amount === undefined || amount === null) return errorResponse('amount is required')
    if (!adjustmentType) return errorResponse('adjustmentType is required')
    if (!reason) return errorResponse('reason is required')
    if (effectiveMonth === undefined || effectiveMonth === null) return errorResponse('effectiveMonth is required')
    if (effectiveYear === undefined || effectiveYear === null) return errorResponse('effectiveYear is required')

    const validTypes = ['maintenance_delay', 'flood_damage', 'utility_failure', 'goodwill', 'contract_amendment', 'owner_discount', 'other']
    if (!validTypes.includes(adjustmentType)) {
      return errorResponse(`adjustmentType must be one of: ${validTypes.join(', ')}`)
    }

    const parsedAmount = safeDecimal(amount)
    if (parsedAmount <= 0) return errorResponse('amount must be greater than zero')

    const parsedMonth = safeNumber(effectiveMonth, 0)
    const parsedYear = safeNumber(effectiveYear, 0)
    if (!parsedMonth || parsedMonth < 1 || parsedMonth > 12) return errorResponse('Invalid effectiveMonth (1-12)')
    if (!parsedYear || parsedYear < 2020) return errorResponse('Invalid effectiveYear')

    const parsedDuration = safeNumber(durationMonths, 1) || 1
    if (parsedDuration < 1 || parsedDuration > 12) return errorResponse('durationMonths must be between 1 and 12')

    // Verify the tenant belongs to the user's company
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: user.companyId, deletedAt: null },
    })
    if (!tenant) {
      return errorResponse('Tenant not found or does not belong to your company', 404)
    }

    // Verify the property belongs to the user's company
    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: user.companyId, deletedAt: null },
    })
    if (!property) {
      return errorResponse('Property not found or does not belong to your company', 404)
    }

    // Verify tenant belongs to the specified property
    if (tenant.propertyId !== propertyId) {
      return errorResponse('Tenant does not belong to the specified property')
    }

    const adjustment = await prisma.rentAdjustment.create({
      data: {
        companyId: user.companyId,
        tenantId,
        propertyId,
        amount: parsedAmount,
        adjustmentType,
        reason,
        notes: notes || null,
        effectiveMonth: parsedMonth,
        effectiveYear: parsedYear,
        durationMonths: parsedDuration,
        status: 'approved',
        createdBy: user.id,
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
        property: {
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
      entity: 'RentAdjustment',
      entityId: adjustment.id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        amount: parsedAmount,
        adjustmentType,
        reason,
        tenantId,
        propertyId,
        effectiveMonth: parsedMonth,
        effectiveYear: parsedYear,
        durationMonths: parsedDuration,
        tenantName: tenant.name,
      },
    })

    return successResponse(serialize(adjustment), 201)
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return errorResponse('Failed to create adjustment', 500)
  }
}
