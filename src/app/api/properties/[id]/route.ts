import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-utils'
import { isFinancialUser } from '@/lib/api-utils'

// Valid property types
const VALID_PROPERTY_TYPES = ['apartment', 'villa', 'office', 'shop', 'studio', 'mixed_use']

// Helper: find a property scoped to the user's company, excluding soft-deleted
async function findPropertyForUser(id: string, companyId: string) {
  return prisma.property.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      tenants: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
        },
      },
    },
  })
}

// GET /api/properties/[id] — Get a single property
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const property = await findPropertyForUser(id, user.companyId)

    if (!property) {
      return errorResponse('Property not found', 404)
    }

    // Compute tenant counts
    const { tenants, ...propertyData } = property
    const tenantCount = tenants.length
    const activeTenantCount = tenants.filter((t) => t.status === 'active').length

    const result = {
      ...propertyData,
      tenantCount,
      activeTenantCount,
    }

    return successResponse(serialize(result))
  } catch (error) {
    console.error(`GET /api/properties/[id] error:`, error)
    return errorResponse('Failed to fetch property', 500)
  }
}

// PUT /api/properties/[id] — Update a property
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await findPropertyForUser(id, user.companyId)

    if (!existing) {
      return errorResponse('Property not found', 404)
    }

    const body = await request.json()

    // Validate type if provided
    if (body.type !== undefined && !VALID_PROPERTY_TYPES.includes(body.type)) {
      return errorResponse(
        `Invalid property type. Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`
      )
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return errorResponse('Property name cannot be empty')
      }

      // Check for duplicate name (excluding the current property and soft-deleted)
      if (body.name.trim() !== existing.name) {
        const duplicate = await prisma.property.findFirst({
          where: {
            companyId: user.companyId,
            name: body.name.trim(),
            deletedAt: null,
            id: { not: id },
          },
        })
        if (duplicate) {
          return errorResponse('A property with this name already exists', 409)
        }
      }
    }

    // Validate numeric fields if provided
    if (body.totalUnits !== undefined) {
      const totalUnits = Number(body.totalUnits)
      if (isNaN(totalUnits) || totalUnits < 1) {
        return errorResponse('totalUnits must be a positive integer')
      }
    }

    if (body.floors !== undefined) {
      const floors = Number(body.floors)
      if (isNaN(floors) || floors < 1) {
        return errorResponse('floors must be a positive integer')
      }
    }

    // Build update data — only include fields that are provided
    const data: Record<string, any> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.nameAr !== undefined) data.nameAr = body.nameAr?.trim() || null
    if (body.nameBn !== undefined) data.nameBn = body.nameBn?.trim() || null
    if (body.nameUr !== undefined) data.nameUr = body.nameUr?.trim() || null
    if (body.type !== undefined) data.type = body.type
    if (body.address !== undefined) data.address = body.address?.trim() || null
    if (body.totalUnits !== undefined) data.totalUnits = Number(body.totalUnits)
    if (body.floors !== undefined) data.floors = Number(body.floors)
    if (body.archived !== undefined) data.archived = Boolean(body.archived)

    // Check if there are any fields to update
    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields provided for update')
    }

    const updated = await prisma.property.update({
      where: { id },
      data,
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Property',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(existing),
        after: serialize(updated),
        changedFields: Object.keys(data),
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error(`PUT /api/properties/[id] error:`, error)
    return errorResponse('Failed to update property', 500)
  }
}

// DELETE /api/properties/[id] — Soft delete a property (owner/admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can delete properties
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can delete properties')
    }

    const { id } = await params

    const existing = await findPropertyForUser(id, user.companyId)

    if (!existing) {
      return errorResponse('Property not found', 404)
    }

    // Check for active tenants — warn but still allow soft delete
    const activeTenants = existing.tenants.filter((t) => t.status === 'active')

    // Perform soft delete by setting deletedAt
    const deleted = await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog({
      action: 'DELETE',
      entity: 'Property',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(existing),
        activeTenantCount: activeTenants.length,
        softDelete: true,
      },
    })

    return successResponse({
      ...serialize(deleted),
      _meta: {
        softDeleted: true,
        activeTenantCount: activeTenants.length,
      },
    })
  } catch (error) {
    console.error(`DELETE /api/properties/[id] error:`, error)
    return errorResponse('Failed to delete property', 500)
  }
}

// PATCH /api/properties/[id] — Archive or unarchive a property
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await findPropertyForUser(id, user.companyId)

    if (!existing) {
      return errorResponse('Property not found', 404)
    }

    const body = await request.json()

    // Validate the archived field
    if (body.archived === undefined || typeof body.archived !== 'boolean') {
      return errorResponse('Request body must include { archived: true } or { archived: false }')
    }

    // Skip update if the archived state is already set
    if (existing.archived === body.archived) {
      return successResponse({
        ...serialize(existing),
        _message: `Property is already ${body.archived ? 'archived' : 'active'}`,
      })
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { archived: body.archived },
    })

    await createAuditLog({
      action: body.archived ? 'ARCHIVE' : 'UNARCHIVE',
      entity: 'Property',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: { archived: existing.archived },
        after: { archived: body.archived },
      },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error(`PATCH /api/properties/[id] error:`, error)
    return errorResponse('Failed to update property archive status', 500)
  }
}
