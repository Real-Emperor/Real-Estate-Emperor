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
import bcrypt from 'bcryptjs'

// GET /api/users - List all users for the company (admin only)
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  if (!isSystemAdmin(user.role)) {
    return forbiddenResponse('Only system admins can view users')
  }

  const users = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
      deletedAt: null, // Exclude soft-deleted users
    },
    select: {
      id: true,
      email: true,
      name: true,
      nameAr: true,
      nameBn: true,
      nameUr: true,
      role: true,
      companyId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(serialize(users))
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  if (!isSystemAdmin(user.role)) {
    return forbiddenResponse('Only system admins can create users')
  }

  const body = await request.json()
  const { email, password, name, nameAr, nameBn, nameUr, role } = body

  if (!email || !password || !name) {
    return errorResponse('Email, password, and name are required')
  }

  // Password policy: minimum 8 chars, at least 1 uppercase, 1 number
  if (password.length < 8) {
    return errorResponse('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    return errorResponse('Password must contain at least one uppercase letter')
  }
  if (!/[0-9]/.test(password)) {
    return errorResponse('Password must contain at least one number')
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return errorResponse('Email is already in use')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      nameAr: nameAr || null,
      nameBn: nameBn || null,
      nameUr: nameUr || null,
      role: role || 'staff',
      companyId: user.companyId,
      mustChangePassword: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      nameAr: true,
      nameBn: true,
      nameUr: true,
      role: true,
      companyId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  await createAuditLog({
    action: 'CREATE',
    entity: 'User',
    entityId: newUser.id,
    userId: user.id,
    companyId: user.companyId,
    details: { email, name, role: newUser.role },
  })

  return successResponse(serialize(newUser), 201)
}
