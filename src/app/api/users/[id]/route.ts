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

// PUT /api/users/[id] - Update a user (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  if (!isSystemAdmin(user.role)) {
    return forbiddenResponse('Only system admins can update users')
  }

  const { id } = await params

  const existing = await prisma.user.findFirst({
    where: { id, companyId: user.companyId },
  })

  if (!existing) {
    return errorResponse('User not found', 404)
  }

  const body = await request.json()
  const { email, name, nameAr, nameBn, nameUr, role, isActive } = body

  // If email is being changed, check for uniqueness
  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    })
    if (emailTaken) {
      return errorResponse('Email is already in use')
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      email: email ?? existing.email,
      name: name ?? existing.name,
      nameAr: nameAr !== undefined ? nameAr : existing.nameAr,
      nameBn: nameBn !== undefined ? nameBn : existing.nameBn,
      nameUr: nameUr !== undefined ? nameUr : existing.nameUr,
      role: role ?? existing.role,
      isActive: isActive !== undefined ? isActive : existing.isActive,
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
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    userId: user.id,
    companyId: user.companyId,
    details: {
      before: { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive },
      after: { name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive },
    },
  })

  return successResponse(serialize(updated))
}

// DELETE /api/users/[id] - Soft delete (deactivate) a user (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()

  if (!isSystemAdmin(user.role)) {
    return forbiddenResponse('Only system admins can deactivate users')
  }

  const { id } = await params

  // Prevent admin from deactivating themselves
  if (id === user.id) {
    return errorResponse('You cannot deactivate your own account')
  }

  const existing = await prisma.user.findFirst({
    where: { id, companyId: user.companyId },
  })

  if (!existing) {
    return errorResponse('User not found', 404)
  }

  if (!existing.isActive) {
    return errorResponse('User is already deactivated')
  }

  // Soft delete: set isActive to false instead of actually deleting
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  })

  await createAuditLog({
    action: 'DELETE',
    entity: 'User',
    entityId: id,
    userId: user.id,
    companyId: user.companyId,
    details: { name: existing.name, email: existing.email, softDeactivate: true },
  })

  return successResponse({ message: 'User deactivated successfully' })
}
