import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/api-utils'

// GET /api/reset-requests — List all reset requests for the user's company (admin/owner only)
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only admin can view reset requests
    if (!isSystemAdmin(user.role) && user.role !== 'owner') {
      return forbiddenResponse('Only admins and owners can view reset requests')
    }

    const resetRequests = await prisma.resetRequest.findMany({
      where: {
        companyId: user.companyId, // Scope to user's company
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
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(serialize(resetRequests))
  } catch (error) {
    console.error('GET /api/reset-requests error:', error)
    return errorResponse('Failed to fetch reset requests', 500)
  }
}

// POST /api/reset-requests — Create a new reset request (anyone, even unauthenticated)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
      return errorResponse('Email is required')
    }

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return errorResponse('Name is required')
    }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return errorResponse('Message is required')
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email.trim())) {
      return errorResponse('Invalid email format')
    }

    // Rate limiting: check if this email already has a pending request
    const existingPending = await prisma.resetRequest.findFirst({
      where: {
        email: body.email.trim().toLowerCase(),
        status: 'pending',
      },
    })

    if (existingPending) {
      return errorResponse('You already have a pending reset request. Please wait for it to be processed.', 429)
    }

    // Find the user to associate the company
    const targetUser = await prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
    })

    const resetRequest = await prisma.resetRequest.create({
      data: {
        email: body.email.trim().toLowerCase(),
        name: body.name.trim(),
        message: body.message.trim(),
        status: 'pending',
        companyId: targetUser?.companyId || null,
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

    return successResponse(serialize(resetRequest), 201)
  } catch (error) {
    console.error('POST /api/reset-requests error:', error)
    return errorResponse('Failed to create reset request', 500)
  }
}
