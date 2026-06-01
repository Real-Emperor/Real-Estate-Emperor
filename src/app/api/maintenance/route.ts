import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  safeNumber,
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'

// GET /api/maintenance - List maintenance items with pagination for the company
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

    const [items, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.maintenance.count({ where }),
    ])

    return successResponse(paginatedResponse(serialize(items), total, pagination))
  } catch (error) {
    console.error('Error fetching maintenance items:', error)
    return errorResponse('Failed to fetch maintenance items', 500)
  }
}

// POST /api/maintenance - Create a new maintenance item
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { title, description, category, vendor, priority, status, propertyId, estimatedCost, actualCost, completedAt } = body

    if (!title || !description) {
      return errorResponse('Title and description are required')
    }

    // When status is completed, set completedAt
    let resolvedCompletedAt = completedAt ? new Date(completedAt) : undefined
    if (status === 'completed' && !resolvedCompletedAt) {
      resolvedCompletedAt = new Date()
    }

    // NaN guards for costs
    const parsedEstimatedCost = estimatedCost ? safeNumber(estimatedCost) : null
    const parsedActualCost = actualCost ? safeNumber(actualCost) : null

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
        estimatedCost: parsedEstimatedCost,
        actualCost: parsedActualCost,
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
  } catch (error) {
    console.error('Error creating maintenance item:', error)
    return errorResponse('Failed to create maintenance item', 500)
  }
}
