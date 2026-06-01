import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  safeNumber,
  safeInt,
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'

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

// POST /api/tenants - Create a new tenant
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
    const parsedRentAmount = safeNumber(body.rentAmount, -1)
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
        sizeSqft: body.sizeSqft ? safeNumber(body.sizeSqft) : null,
        rentAmount: parsedRentAmount,
        municipalityFee: body.municipalityFee ? safeNumber(body.municipalityFee) : null,
        securityDeposit: body.securityDeposit ? safeNumber(body.securityDeposit) : null,
        paymentMethod: body.paymentMethod || null,
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contractDuration: body.contractDuration ? safeInt(body.contractDuration) : null,
        renewalStatus: body.renewalStatus || null,
        newRent: body.newRent ? safeNumber(body.newRent) : null,
        status: body.status || 'active',
        latePaymentCount: body.latePaymentCount ? safeInt(body.latePaymentCount) : 0,
        tenantScore: body.tenantScore ? safeInt(body.tenantScore, 100) : 100,
        notes: body.notes || null,
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
