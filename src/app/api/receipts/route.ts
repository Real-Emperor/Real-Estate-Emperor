import prisma from '@/lib/db'
import {
  getAuthUser,
  createAuditLog,
  serialize,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  safeDecimal,
  safeInt,
  parsePaginationParams,
  paginatedResponse,
} from '@/lib/api-utils'

// GET /api/receipts — List receipts for the company
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can view receipts')
  }

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const pagination = parsePaginationParams(searchParams)

    const where: any = { companyId: user.companyId }
    if (tenantId) where.tenantId = tenantId

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, name: true, nameAr: true, unitNumber: true, propertyId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.receipt.count({ where }),
    ])

    return successResponse(paginatedResponse(receipts.map(serialize), total, pagination))
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return errorResponse('Failed to fetch receipts', 500)
  }
}

// POST /api/receipts — Generate a receipt
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can generate receipts')
  }

  try {
    const body = await request.json()
    const { tenantId, paymentId, amount, date, month, year, description } = body

    if (!tenantId || amount === undefined || !date || !month || !year) {
      return errorResponse('tenantId, amount, date, month, and year are required')
    }

    // Use safeDecimal for monetary precision (matches payments pattern)
    const parsedAmount = safeDecimal(amount)
    if (parsedAmount <= 0) return errorResponse('amount must be greater than zero')
    const parsedMonth = safeInt(month, 0)
    const parsedYear = safeInt(year, 0)
    if (!parsedMonth || !parsedYear) return errorResponse('Invalid month or year')

    // Verify tenant belongs to company
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, companyId: user.companyId },
    })
    if (!tenant) return errorResponse('Tenant not found', 404)

    // Auto-generate receipt number like RCP-2024-0001
    const currentYear = new Date().getFullYear()
    const lastReceipt = await prisma.receipt.findFirst({
      where: {
        companyId: user.companyId,
        receiptNumber: { startsWith: `RCP-${currentYear}-` },
      },
      orderBy: { receiptNumber: 'desc' },
    })

    let nextNumber = 1
    if (lastReceipt) {
      const parts = lastReceipt.receiptNumber.split('-')
      nextNumber = parseInt(parts[2] || '0') + 1
    }
    const receiptNumber = `RCP-${currentYear}-${String(nextNumber).padStart(4, '0')}`

    const receipt = await prisma.receipt.create({
      data: {
        companyId: user.companyId,
        tenantId,
        paymentId: paymentId || null,
        receiptNumber,
        amount: parsedAmount,
        date: new Date(date),
        month: parsedMonth,
        year: parsedYear,
        description: description || null,
        createdBy: user.id,
      },
      include: {
        tenant: {
          select: { id: true, name: true, nameAr: true, unitNumber: true },
        },
      },
    })

    // Create payment_receipt notification
    await prisma.notification.create({
      data: {
        companyId: user.companyId,
        userId: null,
        type: 'payment_receipt',
        title: 'Receipt Generated',
        message: `Receipt ${receiptNumber} generated for tenant ${tenant.name} - AED ${parsedAmount.toLocaleString()}`,
        data: JSON.stringify({ receiptId: receipt.id, receiptNumber, tenantId: tenant.id, amount: parsedAmount }),
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entity: 'Receipt',
      entityId: receipt.id,
      userId: user.id,
      companyId: user.companyId,
      details: { receiptNumber, tenantId, amount: parsedAmount },
    })

    return successResponse(serialize(receipt), 201)
  } catch (error) {
    console.error('Error creating receipt:', error)
    return errorResponse('Failed to create receipt', 500)
  }
}
