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
  parseOCCVersion,
  occUpdate,
} from '@/lib/api-utils'

// PATCH /api/reset-requests/[id] — Resolve or dismiss a reset request (admin only + OCC)
// PHASE 2: Company ownership check; OCC for concurrency safety
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

    // PHASE 2: Company ownership check — ensure the reset request belongs to the same company
    if (resetRequest.companyId && resetRequest.companyId !== user.companyId) {
      return forbiddenResponse('This reset request does not belong to your company')
    }

    if (resetRequest.status !== 'pending') {
      return errorResponse(`Reset request is already ${resetRequest.status}`, 409)
    }

    const body = await request.json()

    // Validate status
    if (!body.status || !['resolved', 'dismissed'].includes(body.status)) {
      return errorResponse('status must be "resolved" or "dismissed"')
    }

    // PHASE 2: OCC — check if the reset request was modified since the client read it
    const occVersion = parseOCCVersion(body)

    const data: Record<string, unknown> = {
      status: body.status,
      resolvedAt: new Date(),
      resolvedBy: user.id,
    }

    const updatedRequest = await occUpdate(
      prisma.resetRequest,
      id,
      occVersion,
      data
    )

    if (updatedRequest instanceof Response) return updatedRequest

    // Fetch with resolver relation for response
    const fullRequest = await prisma.resetRequest.findUnique({
      where: { id },
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
        occProtected: !!occVersion,
      },
    })

    if (!fullRequest) {
      return errorResponse('Failed to fetch updated reset request', 500)
    }

    return successResponse(serialize(fullRequest))
  } catch (error) {
    console.error('PATCH /api/reset-requests/[id] error:', error)
    return errorResponse('Failed to update reset request', 500)
  }
}
