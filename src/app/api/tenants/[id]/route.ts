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

// GET /api/tenants/[id] - Get a single tenant by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
      include: {
        property: true,
        _count: {
          select: { payments: true },
        },
      },
    })

    if (!tenant) {
      return errorResponse('Tenant not found', 404)
    }

    const { _count, ...tenantData } = tenant
    return successResponse({
      ...serialize(tenantData),
      paymentCount: _count.payments,
    })
  } catch (error) {
    console.error('Failed to fetch tenant:', error)
    return errorResponse('Failed to fetch tenant', 500)
  }
}

// PUT /api/tenants/[id] - Update a tenant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    // Verify tenant exists and belongs to user's company
    const existing = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return errorResponse('Tenant not found', 404)
    }

    // If propertyId is being changed, verify the new property belongs to the company
    if (body.propertyId && body.propertyId !== existing.propertyId) {
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
    }

    // Build update data - only include fields that are provided
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name
    if (body.nameAr !== undefined) data.nameAr = body.nameAr || null
    if (body.nameBn !== undefined) data.nameBn = body.nameBn || null
    if (body.nameUr !== undefined) data.nameUr = body.nameUr || null
    if (body.phone !== undefined) data.phone = body.phone
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp || null
    if (body.email !== undefined) data.email = body.email || null
    if (body.emiratesId !== undefined) data.emiratesId = body.emiratesId || null
    if (body.nationality !== undefined) data.nationality = body.nationality || null
    if (body.employer !== undefined) data.employer = body.employer || null
    if (body.emergencyContact !== undefined) data.emergencyContact = body.emergencyContact || null
    if (body.propertyId !== undefined) data.propertyId = body.propertyId
    if (body.unitNumber !== undefined) data.unitNumber = body.unitNumber || null
    if (body.unitType !== undefined) data.unitType = body.unitType || null
    if (body.floor !== undefined) data.floor = body.floor ? Number(body.floor) : null
    if (body.sizeSqft !== undefined) data.sizeSqft = body.sizeSqft ? Number(body.sizeSqft) : null
    if (body.rentAmount !== undefined) data.rentAmount = Number(body.rentAmount)
    if (body.municipalityFee !== undefined) data.municipalityFee = body.municipalityFee ? Number(body.municipalityFee) : null
    if (body.securityDeposit !== undefined) data.securityDeposit = body.securityDeposit ? Number(body.securityDeposit) : null
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null
    if (body.leaseStart !== undefined) data.leaseStart = body.leaseStart ? new Date(body.leaseStart) : null
    if (body.leaseEnd !== undefined) data.leaseEnd = body.leaseEnd ? new Date(body.leaseEnd) : null
    if (body.contractDuration !== undefined) data.contractDuration = body.contractDuration ? Number(body.contractDuration) : null
    if (body.renewalStatus !== undefined) data.renewalStatus = body.renewalStatus || null
    if (body.newRent !== undefined) data.newRent = body.newRent ? Number(body.newRent) : null
    if (body.status !== undefined) data.status = body.status
    if (body.latePaymentCount !== undefined) data.latePaymentCount = Number(body.latePaymentCount)
    if (body.tenantScore !== undefined) data.tenantScore = Number(body.tenantScore)
    if (body.notes !== undefined) data.notes = body.notes || null

    const tenant = await prisma.tenant.update({
      where: { id },
      data,
      include: {
        property: true,
        _count: {
          select: { payments: true },
        },
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: tenant.id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(existing),
        after: serialize(tenant),
      },
    })

    const { _count, ...tenantData } = tenant
    return successResponse({
      ...serialize(tenantData),
      paymentCount: _count.payments,
    })
  } catch (error) {
    console.error('Failed to update tenant:', error)
    return errorResponse('Failed to update tenant', 500)
  }
}

// DELETE /api/tenants/[id] - Soft delete a tenant (owner/admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner or admin can delete tenants
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can delete tenants')
    }

    const { id } = await params

    // Verify tenant exists and belongs to user's company
    const existing = await prisma.tenant.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return errorResponse('Tenant not found', 404)
    }

    // Soft delete - set deletedAt to now
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    })

    await createAuditLog({
      action: 'DELETE',
      entity: 'Tenant',
      entityId: tenant.id,
      userId: user.id,
      companyId: user.companyId,
      details: { name: existing.name, softDelete: true },
    })

    return successResponse({ deleted: true, id: tenant.id })
  } catch (error) {
    console.error('Failed to delete tenant:', error)
    return errorResponse('Failed to delete tenant', 500)
  }
}
