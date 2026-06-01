import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// ─── Auth ──────────────────────────────────────────────────────

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
    mustChangePassword: (session.user as any).mustChangePassword,
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

// ─── Audit Logging ─────────────────────────────────────────────

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
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break operations
  }
}

// ─── NaN Guards ────────────────────────────────────────────────

/**
 * Safely convert a value to a number. Returns `fallback` (default 0) if the
 * result is NaN or not finite. Use this for ALL user-supplied numeric input.
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Safely convert a value to a positive integer. Returns `fallback` if the
 * result is NaN, not finite, or negative.
 */
export function safeInt(value: unknown, fallback: number = 0): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

// ─── Pagination ────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export interface PaginationParams {
  page: number   // 1-based
  limit: number
  skip: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Parse pagination query params from a URL.
 * Supports `page` (1-based) and `limit` (capped at MAX_PAGE_SIZE).
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, safeInt(searchParams.get('page'), 1))
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, safeInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * Build a standard paginated response envelope.
 */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  }
}

// ─── Serialization ─────────────────────────────────────────────

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
      if ('id' in value && ('createdAt' in value || 'updatedAt' in value)) {
        // This looks like a Prisma model, serialize it
        ;(result as any)[key] = serialize(value)
      }
    } else if (Array.isArray(value)) {
      (result as any)[key] = value.map((item: any) =>
        typeof item === 'object' && item !== null ? serialize(item) : item
      )
    } else {
      (result as any)[key] = value
    }
  }
  return result
}

// Parse JSON string fields from DB (details, data, etc.)
export function parseJsonField(value: string | null | undefined): any {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// ─── Response Helpers ──────────────────────────────────────────

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
