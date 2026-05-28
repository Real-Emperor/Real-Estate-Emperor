import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'

// GET /api/maintenance - List all maintenance items for the company
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  const items = await prisma.maintenance.findMany({
    where: {
      companyId: user.companyId,
      deletedAt: null,
    },
    include: {
      property: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(serialize(items))
}

// POST /api/maintenance - Create a new maintenance item
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  const { title, description, category, vendor, priority, status, propertyId, estimatedCost, actualCost, completedAt } = body

  if (!title || !description) {
    return errorResponse('Title and description are required')
  }

  // If status is completed, set completedAt
  let resolvedCompletedAt = completedAt ? new Date(completedAt) : undefined
  if (status === 'completed' && !resolvedCompletedAt) {
    resolvedCompletedAt = new Date()
  }

  const item = await prisma.maintenance.create({
    data: {
      companyId: user.companyId,
      title,
      description,
      category: category || null,
      vendor: vendor || null,
      priority: priority || 'medium',
      status: status || 'pending',
      propertyId: propertyId || null,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      actualCost: actualCost ? parseFloat(actualCost) : null,
      completedAt: resolvedCompletedAt || null,
    },
    include: {
      property: {
        select: { id: true, name: true },
      },
    },
  })

  await createAuditLog({
    action: 'CREATE',
    entity: 'Maintenance',
    entityId: item.id,
    userId: user.id,
    companyId: user.companyId,
    details: { title, description, priority: item.priority, status: item.status },
  })

  return successResponse(serialize(item), 201)
}
