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

// GET /api/notifications — Get notifications for current user + company broadcasts
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100)

    const where: any = {
      companyId: user.companyId,
      OR: [
        { userId: user.id },
        { userId: null }, // broadcast notifications
      ],
    }

    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        companyId: user.companyId,
        read: false,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
    })

    return successResponse({
      notifications: notifications.map(serialize),
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
}

// POST /api/notifications — Create a notification (owner/admin)
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can create notifications')
  }

  try {
    const body = await request.json()
    const { userId, type, title, message, data } = body

    if (!type || !title || !message) {
      return errorResponse('type, title, and message are required')
    }

    const validTypes = ['payment_receipt', 'overdue_notice', 'lease_renewal', 'maintenance_update', 'system', 'daily_report', 'backup_success', 'backup_failed']
    if (!validTypes.includes(type)) {
      return errorResponse(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`)
    }

    // If userId is provided, verify it belongs to same company
    if (userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, companyId: user.companyId },
      })
      if (!targetUser) {
        return errorResponse('Target user not found in your company', 404)
      }
    }

    const notification = await prisma.notification.create({
      data: {
        companyId: user.companyId,
        userId: userId || null,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entity: 'Notification',
      entityId: notification.id,
      userId: user.id,
      companyId: user.companyId,
      details: { type, title, userId: userId || 'broadcast' },
    })

    return successResponse(serialize(notification), 201)
  } catch (error) {
    console.error('Error creating notification:', error)
    return errorResponse('Failed to create notification', 500)
  }
}
