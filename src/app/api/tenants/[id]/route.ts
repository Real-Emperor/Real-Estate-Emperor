import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isOwnerOrAdmin,
  isFinancialUser,
  safeNumber,
  safeDecimal,
  safeInt,
  parseOCCVersion,
  occUpdate,
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

// PUT /api/tenants/[id] - Update a tenant (owner/admin only + OCC)
// PHASE 2: RBAC — staff cannot update tenants; OCC for concurrency safety
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // PHASE 2: RBAC — only owner/admin can update tenants
    if (!isOwnerOrAdmin(user.role)) {
      return forbiddenResponse('Only owners and admins can update tenants')
    }

    const { id } = await params
    const body = await request.json()

    // PHASE 2: Optimistic Concurrency Control
    const occVersion = parseOCCVersion(body)

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

    // Build update data - only include fields that are provided (with NaN guards)
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
    if (body.floor !== undefined) data.floor = body.floor ? safeInt(body.floor) : null
    if (body.sizeSqft !== undefined) data.sizeSqft = body.sizeSqft ? safeDecimal(body.sizeSqft) : null
    if (body.rentAmount !== undefined) data.rentAmount = safeDecimal(body.rentAmount)
    if (body.municipalityFee !== undefined) data.municipalityFee = body.municipalityFee ? safeDecimal(body.municipalityFee) : null
    if (body.securityDeposit !== undefined) data.securityDeposit = body.securityDeposit ? safeDecimal(body.securityDeposit) : null
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null
    if (body.leaseStart !== undefined) data.leaseStart = body.leaseStart ? new Date(body.leaseStart) : null
    if (body.leaseEnd !== undefined) data.leaseEnd = body.leaseEnd ? new Date(body.leaseEnd) : null
    if (body.contractDuration !== undefined) data.contractDuration = body.contractDuration ? safeInt(body.contractDuration) : null
    if (body.renewalStatus !== undefined) data.renewalStatus = body.renewalStatus || null
    if (body.newRent !== undefined) data.newRent = body.newRent ? safeDecimal(body.newRent) : null
    if (body.status !== undefined) data.status = body.status
    if (body.latePaymentCount !== undefined) data.latePaymentCount = safeInt(body.latePaymentCount)
    if (body.tenantScore !== undefined) {
      const score = safeInt(body.tenantScore, 100)
      data.tenantScore = score
      // Always sync systemScore when directly editing
      data.systemScore = score
      // Clear any existing manual override since we're editing directly
      data.manualScoreOverride = null
      data.manualScoreReason = null
      data.manualOverrideBy = null
      data.manualOverrideById = null
      data.manualOverrideAt = null
    }
    // Also handle systemScore being sent directly
    if (body.systemScore !== undefined) {
      data.systemScore = safeInt(body.systemScore, 100)
    }
    if (body.notes !== undefined) data.notes = body.notes || null
    // Phase 1 Rental Accounting: Opening Balance, Credit Balance, Legal Case (admin only)
    if (body.openingBalance !== undefined) {
      if (!isOwnerOrAdmin(user.role)) return forbiddenResponse('Only administrators can modify opening balance')
      data.openingBalance = safeDecimal(body.openingBalance)
    }
    if (body.creditBalance !== undefined) {
      if (!isOwnerOrAdmin(user.role)) return forbiddenResponse('Only administrators can modify credit balance')
      data.creditBalance = safeDecimal(body.creditBalance)
    }
    if (body.legalCase !== undefined) {
      if (!isOwnerOrAdmin(user.role)) return forbiddenResponse('Only administrators can modify legal case status')
      data.legalCase = body.legalCase === true
    }
    if (body.legalCaseNumber !== undefined) {
      if (!isOwnerOrAdmin(user.role)) return forbiddenResponse('Only administrators can modify legal case information')
      data.legalCaseNumber = body.legalCaseNumber || null
    }
    if (body.legalCaseNotes !== undefined) {
      if (!isOwnerOrAdmin(user.role)) return forbiddenResponse('Only administrators can modify legal case information')
      data.legalCaseNotes = body.legalCaseNotes || null
    }

    // PHASE 2: Use OCC-protected update
    const updated = await occUpdate(
      prisma.tenant,
      id,
      occVersion,
      data,
      { companyId: user.companyId, deletedAt: null }
    )

    if (updated instanceof Response) return updated

    // Fetch full record with relations for the response
    const fullTenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        property: true,
        _count: {
          select: { payments: true },
        },
      },
    })

    if (!fullTenant) {
      return errorResponse('Failed to fetch updated tenant', 500)
    }

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(existing),
        after: serialize(fullTenant),
        occProtected: !!occVersion,
      },
    })

    const { _count, ...tenantData } = fullTenant
    return successResponse({
      ...serialize(tenantData),
      paymentCount: _count.payments,
    })
  } catch (error) {
    console.error('Failed to update tenant:', error)
    return errorResponse('Failed to update tenant', 500)
  }
}

// DELETE /api/tenants/[id] - Move Out tenant (owner/admin only)
// Sets tenant status to 'moved_out' and records the move-out date.
// All historical records (payments, receipts, adjustments) are preserved.
// The unit becomes available for new tenant assignment.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner or admin can move out tenants
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can move out tenants')
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

    // Move Out: set status to moved_out and record date
    // All historical data (payments, receipts, adjustments) is preserved
    await prisma.tenant.update({
      where: { id },
      data: {
        status: 'moved_out',
        movedOutAt: new Date(),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: { name: existing.name, action: 'moved_out', previousStatus: existing.status },
    })

    return successResponse({ movedOut: true, id })
  } catch (error) {
    console.error('Failed to move out tenant:', error)
    return errorResponse('Failed to move out tenant', 500)
  }
}
