import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  getAuthUser,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  createAuditLog,
} from '@/lib/api-utils'

// POST /api/production-cutover — Remove all demo data and update company identity
// Auth: NextAuth session (owner/admin) OR CRON_SECRET Bearer token (programmatic access)
export async function POST(request: NextRequest) {
  try {
    // Check for CRON_SECRET auth first (programmatic access)
    const authHeader = request.headers.get('authorization')
    const isCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`

    let companyId: string
    let userId: string

    if (isCronAuth) {
      // Programmatic access via CRON_SECRET — find the first owner/admin company
      const ownerUser = await prisma.user.findFirst({
        where: { role: { in: ['owner', 'admin'] } },
        select: { id: true, companyId: true },
      })
      if (!ownerUser) return unauthorizedResponse()
      companyId = ownerUser.companyId
      userId = ownerUser.id
    } else {
      // Session-based auth
      const user = await getAuthUser()
      if (!user) return unauthorizedResponse()
      if (user.role !== 'owner' && user.role !== 'admin') {
        return forbiddenResponse('Only owners and admins can execute production cutover')
      }
      companyId = user.companyId
      userId = user.id
    }

    // ═══ DELETE ALL DEMO DATA IN CORRECT ORDER (respecting foreign keys) ═══
    
    // 1. Delete all receipts (depends on tenants)
    const deletedReceipts = await prisma.receipt.deleteMany({ where: { companyId } })
    
    // 2. Delete all payments (depends on tenants)
    const deletedPayments = await prisma.payment.deleteMany({ where: { companyId } })
    
    // 3. Delete all expenses
    const deletedExpenses = await prisma.expense.deleteMany({ where: { companyId } })
    
    // 4. Delete all maintenance records
    const deletedMaintenance = await prisma.maintenance.deleteMany({ where: { companyId } })
    
    // 5. Delete all reservations
    const deletedReservations = await prisma.reservation.deleteMany({ where: { companyId } })
    
    // 6. Delete all tenants (depends on properties)
    const deletedTenants = await prisma.tenant.deleteMany({ where: { companyId } })
    
    // 7. Delete all properties
    const deletedProperties = await prisma.property.deleteMany({ where: { companyId } })
    
    // 8. Delete all notifications
    const deletedNotifications = await prisma.notification.deleteMany({ where: { companyId } })
    
    // 9. Delete all backup records
    const deletedBackups = await prisma.backupRecord.deleteMany({ where: { companyId } })
    
    // 10. Delete non-owner/admin staff users (demo users)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        companyId,
        role: 'staff', // Only remove staff accounts; keep owner/admin
      },
    })

    // ═══ UPDATE COMPANY IDENTITY ═══
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: 'Al Reef Al Madeena Real Estate Management and General Maintenance - L.L.C - S.P.C',
        nameAr: 'الريف المدينة لإدارة العقارات والصيانة العامة ذ.م.م - ش. ش. و',
        nameBn: 'আল রিফ আল মাদিনা রিয়েল এস্টেট ম্যানেজমেন্ট অ্যান্ড জেনারেল মেইনটেন্যান্স - এলএলসি - এসপিসি',
        nameUr: 'الریف المدینہ برائے املاک کا انتظام اور عام دیکھ بھال - ذ.م.م - ش. ش. و',
        phone: '+971504225590',
        email: 'alreef.junoobi@gmail.com',
        address: "Near LuLu Muraba'a, Al Ain City, Abu Dhabi Emirate, UAE",
      },
    })

    // ═══ AUDIT LOG ═══
    await createAuditLog({
      action: 'DELETE',
      entity: 'Company',
      entityId: companyId,
      userId,
      companyId,
      details: JSON.stringify({
        operation: 'PRODUCTION_CUTOVER',
        deleted: {
          receipts: deletedReceipts.count,
          payments: deletedPayments.count,
          expenses: deletedExpenses.count,
          maintenance: deletedMaintenance.count,
          reservations: deletedReservations.count,
          tenants: deletedTenants.count,
          properties: deletedProperties.count,
          notifications: deletedNotifications.count,
          backups: deletedBackups.count,
          staffUsers: deletedUsers.count,
        },
        companyName: updatedCompany.name,
      }),
    })

    return successResponse({
      message: 'Production cutover completed successfully. All demo data removed.',
      deleted: {
        receipts: deletedReceipts.count,
        payments: deletedPayments.count,
        expenses: deletedExpenses.count,
        maintenance: deletedMaintenance.count,
        reservations: deletedReservations.count,
        tenants: deletedTenants.count,
        properties: deletedProperties.count,
        notifications: deletedNotifications.count,
        backups: deletedBackups.count,
        staffUsers: deletedUsers.count,
      },
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        nameAr: updatedCompany.nameAr,
        phone: updatedCompany.phone,
        email: updatedCompany.email,
        address: updatedCompany.address,
      },
    })
  } catch (error) {
    console.error('Production cutover error:', error)
    return errorResponse('Failed to execute production cutover', 500)
  }
}
