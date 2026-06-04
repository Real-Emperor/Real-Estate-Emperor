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
import { sendNotificationEmail } from '@/lib/email'

// POST /api/notifications/send — Trigger notification sending (owner/admin)
// Supports: payment_receipt, overdue_notice, lease_renewal
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can send notifications')
  }

  try {
    const body = await request.json()
    const { type, tenantId, customMessage } = body

    const validTypes = ['payment_receipt', 'overdue_notice', 'lease_renewal']
    if (!type || !validTypes.includes(type)) {
      return errorResponse(`type is required and must be one of: ${validTypes.join(', ')}`)
    }

    const createdNotifications: any[] = []
    const company = await prisma.company.findUnique({ where: { id: user.companyId } })
    const companyName = company?.name || 'Al Reef Dashboard'

    if (type === 'payment_receipt') {
      // Create payment receipt notification for a specific tenant
      if (!tenantId) return errorResponse('tenantId is required for payment_receipt')

      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, companyId: user.companyId },
      })
      if (!tenant) return errorResponse('Tenant not found', 404)

      const notification = await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: null, // broadcast to company
          type: 'payment_receipt',
          title: 'Payment Receipt',
          message: customMessage || `Payment receipt generated for tenant ${tenant.name}`,
          data: JSON.stringify({ tenantId: tenant.id, tenantName: tenant.name }),
        },
      })
      createdNotifications.push(serialize(notification))

      // Send email notification if tenant has email
      if (tenant.email) {
        sendNotificationEmail(
          tenant.email,
          'Payment Receipt',
          `<p>A payment receipt has been generated for your rental account.</p><p>Unit: ${tenant.unitNumber || 'N/A'}<br>Amount: AED ${tenant.rentAmount.toLocaleString()}</p>`,
          companyName
        ).catch(() => {})
      }
    }

    if (type === 'overdue_notice') {
      // Create overdue notifications for all overdue tenants
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Get all active tenants for the company
      const tenants = await prisma.tenant.findMany({
        where: { companyId: user.companyId, status: 'active' },
        include: { payments: true },
      })

      // Find tenants who haven't paid this month
      const overdueTenants = tenants.filter(tenant => {
        const paidThisMonth = tenant.payments
          .filter(p => p.month === currentMonth && p.year === currentYear)
          .reduce((sum, p) => sum + p.amount, 0)
        return paidThisMonth < tenant.rentAmount
      })

      for (const tenant of overdueTenants) {
        const existing = await prisma.notification.findFirst({
          where: {
            companyId: user.companyId,
            type: 'overdue_notice',
            data: { contains: tenant.id },
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          },
        })

        if (!existing) {
          const notification = await prisma.notification.create({
            data: {
              companyId: user.companyId,
              userId: null,
              type: 'overdue_notice',
              title: 'Overdue Rent Notice',
              message: customMessage || `Tenant ${tenant.name} has overdue rent for ${currentMonth}/${currentYear}`,
              data: JSON.stringify({ tenantId: tenant.id, tenantName: tenant.name, month: currentMonth, year: currentYear }),
            },
          })
          createdNotifications.push(serialize(notification))

          // Send email to overdue tenant
          if (tenant.email) {
            sendNotificationEmail(
              tenant.email,
              'Overdue Rent Notice',
              `<p>This is a reminder that your rent payment for ${currentMonth}/${currentYear} is overdue.</p><p>Amount due: AED ${tenant.rentAmount.toLocaleString()}</p><p>Please make the payment at your earliest convenience.</p>`,
              companyName
            ).catch(() => {})
          }
        }
      }
    }

    if (type === 'lease_renewal') {
      // Create lease renewal notifications for leases expiring within 30 days
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const expiringTenants = await prisma.tenant.findMany({
        where: {
          companyId: user.companyId,
          status: 'active',
          leaseEnd: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      })

      for (const tenant of expiringTenants) {
        const notification = await prisma.notification.create({
          data: {
            companyId: user.companyId,
            userId: null,
            type: 'lease_renewal',
            title: 'Lease Expiring Soon',
            message: customMessage || `Tenant ${tenant.name}'s lease expires on ${tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'N/A'}`,
            data: JSON.stringify({ tenantId: tenant.id, tenantName: tenant.name, leaseEnd: tenant.leaseEnd?.toISOString() }),
          },
        })
        createdNotifications.push(serialize(notification))

        // Send email to tenant about lease renewal
        if (tenant.email) {
          sendNotificationEmail(
            tenant.email,
            'Lease Expiring Soon',
            `<p>This is a notice that your lease for unit ${tenant.unitNumber || 'N/A'} is expiring on ${tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'N/A'}.</p><p>Please contact us to discuss renewal options.</p>`,
            companyName
          ).catch(() => {})
        }
      }
    }

    await createAuditLog({
      action: 'CREATE',
      entity: 'Notification',
      userId: user.id,
      companyId: user.companyId,
      details: { type, count: createdNotifications.length },
    })

    return successResponse({ created: createdNotifications, count: createdNotifications.length }, 201)
  } catch (error) {
    console.error('Error sending notifications:', error)
    return errorResponse('Failed to send notifications', 500)
  }
}
