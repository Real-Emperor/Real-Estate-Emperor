import prisma from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
  parsePaginationParams,
  paginatedResponse,
  serialize,
} from '@/lib/api-utils'

// GET /api/backup/history — List backup records for the current company
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can view backup history
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbiddenResponse('Only owners and admins can view backup history')
    }

    const url = new URL(request.url)
    const searchParams = url.searchParams
    const { page, limit, skip } = parsePaginationParams(searchParams)

    // Filters
    const typeFilter = searchParams.get('type') || 'all' // auto | manual | all
    const statusFilter = searchParams.get('status') || 'all' // completed | failed | all

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    }

    if (typeFilter !== 'all') {
      where.type = typeFilter
    }

    if (statusFilter !== 'all') {
      where.status = statusFilter
    }

    const [records, total] = await Promise.all([
      prisma.backupRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.backupRecord.count({ where }),
    ])

    const serialized = records.map(serialize)

    return successResponse(paginatedResponse(serialized, total, { page, limit, skip }))
  } catch (error) {
    console.error('Backup history error:', error)
    return errorResponse('Failed to fetch backup history', 500)
  }
}
