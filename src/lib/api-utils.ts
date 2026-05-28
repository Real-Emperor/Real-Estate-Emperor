import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// Get the current authenticated user from the request
export async function getAuthUser() {
  const session = await auth()
  if (!session?.user) return null
  return {
    id: (session.user as any).id,
    email: session.user.email!,
    name: session.user.name!,
    role: (session.user as any).role,
    companyId: (session.user as any).companyId,
    nameAr: (session.user as any).nameAr,
    nameBn: (session.user as any).nameBn,
    nameUr: (session.user as any).nameUr,
  }
}

// Check if user has financial access (owner or admin)
export function isFinancialUser(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

// Check if user is system admin
export function isSystemAdmin(role: string): boolean {
  return role === 'admin'
}

// Create an audit log entry
export async function createAuditLog(params: {
  action: string
  entity: string
  entityId?: string
  userId: string
  companyId: string
  details?: any
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        companyId: params.companyId,
        details: params.details || undefined,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break operations
  }
}

// Serialize a Prisma model for API responses (convert DateTime to ISO strings)
export function serialize<T extends Record<string, any>>(obj: T): T {
  if (!obj) return obj
  const result: any = Array.isArray(obj) ? [] : {}
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key]
    if (value instanceof Date) {
      (result as any)[key] = value.toISOString()
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle nested objects (like relations)
      if ('id' in value && 'createdAt' in value) {
        // This looks like a Prisma model, serialize it
        ;(result as any)[key] = serialize(value)
      }
    } else if (Array.isArray(value)) {
      ;(result as any)[key] = value.map((item: any) =>
        typeof item === 'object' && item !== null ? serialize(item) : item
      )
    } else {
      ;(result as any)[key] = value
    }
  }
  return result
}

// Standard error response helper
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

// Standard success response helper
export function successResponse(data: any, status: number = 200) {
  return Response.json(data, { status })
}

// Unauthorized response
export function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

// Forbidden response
export function forbiddenResponse(message: string = 'Access denied') {
  return Response.json({ error: message }, { status: 403 })
}
