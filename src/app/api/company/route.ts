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

// GET /api/company — Return the company info for the authenticated user's companyId
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    })

    if (!company) {
      return errorResponse('Company not found', 404)
    }

    return successResponse(serialize(company))
  } catch (error) {
    console.error('GET /api/company error:', error)
    return errorResponse('Failed to fetch company info', 500)
  }
}

// PUT /api/company — Update company info (only owner/admin)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner or admin can update company info
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbiddenResponse('Only owners and admins can update company info')
    }

    const body = await request.json()

    // Fetch current company for audit log
    const currentCompany = await prisma.company.findUnique({
      where: { id: user.companyId },
    })

    if (!currentCompany) {
      return errorResponse('Company not found', 404)
    }

    // Build update data — only allow specific fields
    const updateData: Record<string, any> = {}

    const allowedFields = ['name', 'nameAr', 'nameBn', 'nameUr', 'phone', 'email', 'address', 'logoUrl']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === null ? null : String(body[field]).trim() || null
      }
    }

    // Ensure at least the primary name is not empty if provided
    if (updateData.name !== undefined && updateData.name !== null && !updateData.name) {
      return errorResponse('Company name cannot be empty')
    }

    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Company',
      entityId: user.companyId,
      userId: user.id,
      companyId: user.companyId,
      details: {
        before: serialize(currentCompany),
        after: serialize(updatedCompany),
        updatedFields: Object.keys(updateData),
      },
    })

    return successResponse(serialize(updatedCompany))
  } catch (error) {
    console.error('PUT /api/company error:', error)
    return errorResponse('Failed to update company info', 500)
  }
}
