import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/api-utils'

// PATCH /api/reset-requests/[id] — Resolve or dismiss a reset request (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only admin/owner can resolve/dismiss reset requests
    if (!isSystemAdmin(user.role) && user.role !== 'owner') {
      return forbiddenResponse('Only admins and owners can manage reset requests')
    }

    const { id } = await params

    // Validate the request exists
    const resetRequest = await prisma.resetRequest.findUnique({
      where: { id },
    })

    if (!resetRequest) {
      return errorResponse('Reset request not found', 404)
    }

    if (resetRequest.status !== 'pending') {
      return errorResponse(`Reset request is already ${resetRequest.status}`, 409)
    }

    const body = await request.json()

    // Validate status
    if (!body.status || !['resolved', 'dismissed'].includes(body.status)) {
      return errorResponse('status must be "resolved" or "dismissed"')
    }

    const updatedRequest = await prisma.resetRequest.update({
      where: { id },
      data: {
        status: body.status,
        resolvedAt: new Date(),
        resolvedBy: user.id,
      },
      include: {
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'ResetRequest',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      details: {
        previousStatus: resetRequest.status,
        newStatus: body.status,
        requestEmail: resetRequest.email,
        requestName: resetRequest.name,
      },
    })

    return successResponse(serialize(updatedRequest))
  } catch (error) {
    console.error('PATCH /api/reset-requests/[id] error:', error)
    return errorResponse('Failed to update reset request', 500)
  }
}
