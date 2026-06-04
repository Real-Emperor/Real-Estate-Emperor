import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api-utils'

// PATCH /api/notifications/[id] — Mark as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
    })

    if (!notification) {
      return errorResponse('Notification not found', 404)
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    return successResponse(serialize(updated))
  } catch (error) {
    console.error('Error updating notification:', error)
    return errorResponse('Failed to update notification', 500)
  }
}
