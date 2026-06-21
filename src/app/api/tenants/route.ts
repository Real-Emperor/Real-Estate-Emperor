import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  safeNumber,
  safeDecimal,
  safeInt,
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'
import { FINANCIALLY_ACTIVE_STATUSES } from '@/lib/utils'

// GET /api/tenants - List tenants with pagination for the authenticated user's company
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const pagination = parsePaginationParams(searchParams)
    const status = searchParams.get('status')?.trim() || undefined

    const where: any = {
      companyId: user.companyId,
      deletedAt: null,
    }

    if (status) where.status = status

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          property: true,
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.tenant.count({ where }),
    ])

    const result = tenants.map(({ _count, ...tenant }) => ({
      ...serialize(tenant),
      paymentCount: _count.payments,
    }))

    return successResponse(paginatedResponse(result, total, pagination))
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
    return errorResponse('Failed to fetch tenants', 500)
  }
}

// POST /api/tenants - Create a new tenant (all authenticated users)
// Staff can create tenants but only owner/admin can edit/delete
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.phone || !body.propertyId || body.rentAmount === undefined) {
      return errorResponse('Missing required fields: name, phone, propertyId, rentAmount')
    }

    // NaN guards for all numeric fields
    // PHASE 3: Use safeDecimal for monetary precision
    const parsedRentAmount = safeDecimal(body.rentAmount)
    if (parsedRentAmount <= 0) return errorResponse('rentAmount must be greater than zero')

    // Verify the property belongs to the user's company
    const property = await prisma.property.findFirst({
      where: {
        id: body.propertyId,
        companyId: user.companyId,
        deletedAt: null,
      },
    })
    if (!property) {
      return errorResponse('Property not found or does not belong to your company')
    }

    // Over-allocation prevention: check if property has available units
    const activeTenantCount = await prisma.tenant.count({
      where: {
        propertyId: body.propertyId,
        status: { in: [...FINANCIALLY_ACTIVE_STATUSES] },
        deletedAt: null,
      },
    })
    if (activeTenantCount >= property.totalUnits) {
      return errorResponse('Property is fully occupied. No vacant units available.', 409)
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyId: user.companyId,
        propertyId: body.propertyId,
        name: body.name,
        nameAr: body.nameAr || null,
        nameBn: body.nameBn || null,
        nameUr: body.nameUr || null,
        phone: body.phone,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        emiratesId: body.emiratesId || null,
        nationality: body.nationality || null,
        employer: body.employer || null,
        emergencyContact: body.emergencyContact || null,
        unitNumber: body.unitNumber || null,
        unitType: body.unitType || null,
        floor: body.floor ? safeInt(body.floor) : null,
        sizeSqft: body.sizeSqft ? safeDecimal(body.sizeSqft) : null,
        rentAmount: parsedRentAmount,
        municipalityFee: body.municipalityFee ? safeDecimal(body.municipalityFee) : null,
        securityDeposit: body.securityDeposit ? safeDecimal(body.securityDeposit) : null,
        paymentMethod: body.paymentMethod || null,
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contractDuration: body.contractDuration ? safeInt(body.contractDuration) : null,
        renewalStatus: body.renewalStatus || null,
        newRent: body.newRent ? safeDecimal(body.newRent) : null,
        status: body.status || 'active',
        latePaymentCount: body.latePaymentCount ? safeInt(body.latePaymentCount) : 0,
        tenantScore: body.tenantScore ? safeInt(body.tenantScore, 100) : 100,
        systemScore: body.tenantScore ? safeInt(body.tenantScore, 100) : 100,
        notes: body.notes || null,
        // Phase 1 Rental Accounting: Opening Balance, Credit Balance, Legal Case
        openingBalance: body.openingBalance ? safeDecimal(body.openingBalance) : 0,
        creditBalance: body.creditBalance ? safeDecimal(body.creditBalance) : 0,
        legalCase: body.legalCase === true,
        legalCaseNumber: body.legalCaseNumber || null,
        legalCaseNotes: body.legalCaseNotes || null,
      },
      include: {
        property: true,
        _count: {
          select: { payments: true },
        },
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entity: 'Tenant',
      entityId: tenant.id,
      userId: user.id,
      companyId: user.companyId,
      details: { name: tenant.name, propertyId: tenant.propertyId, unitNumber: tenant.unitNumber },
    })

    const { _count, ...tenantData } = tenant
    return successResponse(
      { ...serialize(tenantData), paymentCount: _count.payments },
      201
    )
  } catch (error) {
    console.error('Failed to create tenant:', error)
    return errorResponse('Failed to create tenant', 500)
  }
}
