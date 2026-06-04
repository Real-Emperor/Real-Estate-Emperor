import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'

// POST /api/notifications/mark-all-read — Mark all as read
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    const result = await prisma.notification.updateMany({
      where: {
        companyId: user.companyId,
        read: false,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
      data: { read: true },
    })

    return successResponse({ markedAsRead: result.count })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return errorResponse('Failed to mark notifications as read', 500)
  }
}
