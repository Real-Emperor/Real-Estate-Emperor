import prisma from '@/lib/db'
import crypto from 'crypto'
import {
  getAuthUser,
  createAuditLog,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
} from '@/lib/api-utils'

// GET /api/backup — Export all company data as JSON (for backup)
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can create backups
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbiddenResponse('Only owners and admins can create backups')
    }

    const companyId = user.companyId

    // Fetch all company data
    const [company, properties, tenants, expenses, maintenance, users, auditLogs, recurringBills, recurringBillPayments, billReminders] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.property.findMany({ where: { companyId, deletedAt: null } }),
      prisma.tenant.findMany({
        where: { companyId, deletedAt: null },
        include: { payments: true },
      }),
      prisma.expense.findMany({ where: { companyId, deletedAt: null } }),
      prisma.maintenance.findMany({ where: { companyId, deletedAt: null } }),
      prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          email: true,
          name: true,
          nameAr: true,
          nameBn: true,
          nameUr: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Exclude password for security
        },
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to last 1000 entries
      }),
      prisma.recurringBill.findMany({
        where: { companyId, deletedAt: null },
        include: { payments: true },
      }),
      prisma.recurringBillPayment.findMany({
        where: { companyId },
      }),
      prisma.billReminder.findMany({
        where: { companyId },
      }),
    ])

    // Also fetch soft-deleted records for complete backup
    const [deletedProperties, deletedTenants, deletedExpenses, deletedMaintenance] = await Promise.all([
      prisma.property.findMany({ where: { companyId, deletedAt: { not: null } } }),
      prisma.tenant.findMany({
        where: { companyId, deletedAt: { not: null } },
        include: { payments: true },
      }),
      prisma.expense.findMany({ where: { companyId, deletedAt: { not: null } } }),
      prisma.maintenance.findMany({ where: { companyId, deletedAt: { not: null } } }),
    ])

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      company,
      data: {
        properties,
        tenants,
        expenses,
        maintenance,
        users,
        auditLogs,
        recurringBills,
        recurringBillPayments,
        billReminders,
      },
      deleted: {
        properties: deletedProperties,
        tenants: deletedTenants,
        expenses: deletedExpenses,
        maintenance: deletedMaintenance,
      },
    }

    const backupJson = JSON.stringify(backup, null, 2)
    const backupSize = Buffer.byteLength(backupJson, 'utf-8')
    const recordCount = properties.length + tenants.length + expenses.length + maintenance.length + users.length + recurringBills.length

    // Compute SHA-256 data hash for integrity verification
    const dataHash = crypto.createHash('sha256').update(backupJson).digest('hex')

    // Create BackupRecord for manual backup
    await prisma.backupRecord.create({
      data: {
        companyId,
        type: 'manual',
        size: backupSize,
        recordCount,
        status: 'completed',
        dataHash,
        triggeredBy: user.id,
      },
    })

    // Log the backup
    await createAuditLog({
      action: 'BACKUP',
      entity: 'Company',
      entityId: companyId,
      userId: user.id,
      companyId,
      details: {
        properties: properties.length,
        tenants: tenants.length,
        expenses: expenses.length,
        maintenance: maintenance.length,
        users: users.length,
        recurringBills: recurringBills.length,
        dataHash,
      },
    })

    // Return as downloadable JSON with X-Backup-Hash header
    return new Response(backupJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="emperor-backup-${new Date().toISOString().split('T')[0]}.json"`,
        'X-Backup-Hash': dataHash,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return errorResponse('Failed to create backup', 500)
  }
}

// POST /api/backup — Restore data from a backup file
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only admin can restore backups
    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can restore backups')
    }

    const body = await request.json()

    if (!body.version || !body.company || !body.data) {
      return errorResponse('Invalid backup file format')
    }

    const companyId = user.companyId

    // Verify the backup belongs to this company
    if (body.company.id !== companyId) {
      return errorResponse('Backup file belongs to a different company')
    }

    // Log the restore attempt
    await createAuditLog({
      action: 'RESTORE_START',
      entity: 'Company',
      entityId: companyId,
      userId: user.id,
      companyId,
      details: { backupDate: body.exportedAt },
    })

    const summary = {
      properties: 0,
      tenants: 0,
      payments: 0,
      expenses: 0,
      maintenance: 0,
      deletedProperties: 0,
      deletedTenants: 0,
      deletedExpenses: 0,
      deletedMaintenance: 0,
    }

    // Upsert properties
    if (body.data.properties) {
      for (const prop of body.data.properties) {
        await prisma.property.upsert({
          where: { id: prop.id },
          update: {
            name: prop.name,
            nameAr: prop.nameAr,
            nameBn: prop.nameBn,
            nameUr: prop.nameUr,
            type: prop.type,
            address: prop.address,
            totalUnits: prop.totalUnits,
            floors: prop.floors,
            archived: prop.archived,
          },
          create: {
            id: prop.id,
            companyId,
            name: prop.name,
            nameAr: prop.nameAr,
            nameBn: prop.nameBn,
            nameUr: prop.nameUr,
            type: prop.type,
            address: prop.address,
            totalUnits: prop.totalUnits,
            floors: prop.floors,
            archived: prop.archived,
          },
        })
        summary.properties++
      }
    }

    // Upsert tenants
    if (body.data.tenants) {
      for (const tenant of body.data.tenants) {
        await prisma.tenant.upsert({
          where: { id: tenant.id },
          update: {
            name: tenant.name,
            phone: tenant.phone,
            rentAmount: tenant.rentAmount,
            status: tenant.status,
            unitNumber: tenant.unitNumber,
          },
          create: {
            id: tenant.id,
            companyId,
            propertyId: tenant.propertyId,
            name: tenant.name,
            nameAr: tenant.nameAr,
            nameBn: tenant.nameBn,
            nameUr: tenant.nameUr,
            phone: tenant.phone,
            whatsapp: tenant.whatsapp,
            email: tenant.email,
            emiratesId: tenant.emiratesId,
            nationality: tenant.nationality,
            employer: tenant.employer,
            emergencyContact: tenant.emergencyContact,
            unitNumber: tenant.unitNumber,
            unitType: tenant.unitType,
            floor: tenant.floor,
            sizeSqft: tenant.sizeSqft,
            rentAmount: tenant.rentAmount,
            municipalityFee: tenant.municipalityFee,
            securityDeposit: tenant.securityDeposit,
            paymentMethod: tenant.paymentMethod,
            leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart) : null,
            leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd) : null,
            contractDuration: tenant.contractDuration,
            renewalStatus: tenant.renewalStatus,
            newRent: tenant.newRent,
            status: tenant.status || 'active',
            latePaymentCount: tenant.latePaymentCount || 0,
            tenantScore: tenant.tenantScore ?? 100,
            systemScore: tenant.systemScore ?? tenant.tenantScore ?? 100,
            notes: tenant.notes,
          },
        })
        summary.tenants++

        // Upsert payments for this tenant
        if (tenant.payments) {
          for (const payment of tenant.payments) {
            await prisma.payment.upsert({
              where: { id: payment.id },
              update: {
                amount: payment.amount,
                date: new Date(payment.date),
                month: payment.month,
                year: payment.year,
              },
              create: {
                id: payment.id,
                tenantId: tenant.id,
                amount: payment.amount,
                date: new Date(payment.date),
                month: payment.month,
                year: payment.year,
                method: payment.method,
                reference: payment.reference,
                receiptNumber: payment.receiptNumber,
                notes: payment.notes,
                isLate: payment.isLate || false,
                daysLate: payment.daysLate || 0,
                allocationType: payment.allocationType || 'CURRENT_RENT',
              },
            })
            summary.payments++
          }
        }
      }
    }

    // Upsert expenses
    if (body.data.expenses) {
      for (const expense of body.data.expenses) {
        await prisma.expense.upsert({
          where: { id: expense.id },
          update: {
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
          },
          create: {
            id: expense.id,
            companyId,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: new Date(expense.date),
            vendor: expense.vendor,
            invoiceNumber: expense.invoiceNumber,
            recurring: expense.recurring || false,
            building: expense.building,
          },
        })
        summary.expenses++
      }
    }

    // Upsert maintenance
    if (body.data.maintenance) {
      for (const maint of body.data.maintenance) {
        await prisma.maintenance.upsert({
          where: { id: maint.id },
          update: {
            title: maint.title,
            status: maint.status,
          },
          create: {
            id: maint.id,
            companyId,
            propertyId: maint.propertyId,
            title: maint.title,
            description: maint.description,
            category: maint.category,
            vendor: maint.vendor,
            priority: maint.priority || 'medium',
            status: maint.status || 'pending',
            estimatedCost: maint.estimatedCost,
            actualCost: maint.actualCost,
            completedAt: maint.completedAt ? new Date(maint.completedAt) : null,
          },
        })
        summary.maintenance++
      }
    }

    // Restore soft-deleted properties
    if (body.deleted?.properties) {
      for (const prop of body.deleted.properties) {
        await prisma.property.upsert({
          where: { id: prop.id },
          update: {
            name: prop.name,
            nameAr: prop.nameAr,
            nameBn: prop.nameBn,
            nameUr: prop.nameUr,
            type: prop.type,
            address: prop.address,
            totalUnits: prop.totalUnits,
            floors: prop.floors,
            archived: prop.archived,
            deletedAt: prop.deletedAt ? new Date(prop.deletedAt) : null,
          },
          create: {
            id: prop.id,
            companyId,
            name: prop.name,
            nameAr: prop.nameAr,
            nameBn: prop.nameBn,
            nameUr: prop.nameUr,
            type: prop.type,
            address: prop.address,
            totalUnits: prop.totalUnits,
            floors: prop.floors,
            archived: prop.archived,
            deletedAt: prop.deletedAt ? new Date(prop.deletedAt) : null,
          },
        })
        summary.deletedProperties++
      }
    }

    // Restore soft-deleted tenants
    if (body.deleted?.tenants) {
      for (const tenant of body.deleted.tenants) {
        await prisma.tenant.upsert({
          where: { id: tenant.id },
          update: {
            name: tenant.name,
            phone: tenant.phone,
            rentAmount: tenant.rentAmount,
            status: tenant.status,
            unitNumber: tenant.unitNumber,
            deletedAt: tenant.deletedAt ? new Date(tenant.deletedAt) : null,
          },
          create: {
            id: tenant.id,
            companyId,
            propertyId: tenant.propertyId,
            name: tenant.name,
            nameAr: tenant.nameAr,
            nameBn: tenant.nameBn,
            nameUr: tenant.nameUr,
            phone: tenant.phone,
            whatsapp: tenant.whatsapp,
            email: tenant.email,
            emiratesId: tenant.emiratesId,
            nationality: tenant.nationality,
            employer: tenant.employer,
            emergencyContact: tenant.emergencyContact,
            unitNumber: tenant.unitNumber,
            unitType: tenant.unitType,
            floor: tenant.floor,
            sizeSqft: tenant.sizeSqft,
            rentAmount: tenant.rentAmount,
            municipalityFee: tenant.municipalityFee,
            securityDeposit: tenant.securityDeposit,
            paymentMethod: tenant.paymentMethod,
            leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart) : null,
            leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd) : null,
            contractDuration: tenant.contractDuration,
            renewalStatus: tenant.renewalStatus,
            newRent: tenant.newRent,
            status: tenant.status || 'active',
            latePaymentCount: tenant.latePaymentCount || 0,
            tenantScore: tenant.tenantScore ?? 100,
            systemScore: tenant.systemScore ?? tenant.tenantScore ?? 100,
            notes: tenant.notes,
            deletedAt: tenant.deletedAt ? new Date(tenant.deletedAt) : null,
          },
        })
        summary.deletedTenants++

        // Restore payments for soft-deleted tenants
        if (tenant.payments) {
          for (const payment of tenant.payments) {
            await prisma.payment.upsert({
              where: { id: payment.id },
              update: {
                amount: payment.amount,
                date: new Date(payment.date),
                month: payment.month,
                year: payment.year,
              },
              create: {
                id: payment.id,
                tenantId: tenant.id,
                amount: payment.amount,
                date: new Date(payment.date),
                month: payment.month,
                year: payment.year,
                method: payment.method,
                reference: payment.reference,
                receiptNumber: payment.receiptNumber,
                notes: payment.notes,
                isLate: payment.isLate || false,
                daysLate: payment.daysLate || 0,
                allocationType: payment.allocationType || 'CURRENT_RENT',
              },
            })
          }
        }
      }
    }

    // Restore soft-deleted expenses
    if (body.deleted?.expenses) {
      for (const expense of body.deleted.expenses) {
        await prisma.expense.upsert({
          where: { id: expense.id },
          update: {
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            deletedAt: expense.deletedAt ? new Date(expense.deletedAt) : null,
          },
          create: {
            id: expense.id,
            companyId,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: new Date(expense.date),
            vendor: expense.vendor,
            invoiceNumber: expense.invoiceNumber,
            recurring: expense.recurring || false,
            building: expense.building,
            deletedAt: expense.deletedAt ? new Date(expense.deletedAt) : null,
          },
        })
        summary.deletedExpenses++
      }
    }

    // Restore soft-deleted maintenance
    if (body.deleted?.maintenance) {
      for (const maint of body.deleted.maintenance) {
        await prisma.maintenance.upsert({
          where: { id: maint.id },
          update: {
            title: maint.title,
            status: maint.status,
            deletedAt: maint.deletedAt ? new Date(maint.deletedAt) : null,
          },
          create: {
            id: maint.id,
            companyId,
            propertyId: maint.propertyId,
            title: maint.title,
            description: maint.description,
            category: maint.category,
            vendor: maint.vendor,
            priority: maint.priority || 'medium',
            status: maint.status || 'pending',
            estimatedCost: maint.estimatedCost,
            actualCost: maint.actualCost,
            completedAt: maint.completedAt ? new Date(maint.completedAt) : null,
            deletedAt: maint.deletedAt ? new Date(maint.deletedAt) : null,
          },
        })
        summary.deletedMaintenance++
      }
    }

    // Restore recurring bills
    if (body.data?.recurringBills) {
      for (const bill of body.data.recurringBills) {
        await prisma.recurringBill.upsert({
          where: { id: bill.id },
          update: {
            providerName: bill.providerName,
            serviceType: bill.serviceType,
            monthlyExpectedAmount: bill.monthlyExpectedAmount,
            status: bill.status,
          },
          create: {
            id: bill.id,
            companyId,
            propertyId: bill.propertyId,
            providerName: bill.providerName,
            serviceType: bill.serviceType,
            accountNumber: bill.accountNumber,
            customerNumber: bill.customerNumber,
            contractNumber: bill.contractNumber,
            monthlyExpectedAmount: bill.monthlyExpectedAmount,
            currentOutstandingBalance: bill.currentOutstandingBalance || 0,
            previousOutstandingBalance: bill.previousOutstandingBalance || 0,
            totalAmountDue: bill.totalAmountDue || 0,
            lastPaymentAmount: bill.lastPaymentAmount,
            lastPaymentDate: bill.lastPaymentDate ? new Date(bill.lastPaymentDate) : null,
            nextDueDate: bill.nextDueDate ? new Date(bill.nextDueDate) : null,
            billingFrequency: bill.billingFrequency || 'monthly',
            status: bill.status || 'active',
            autoRenew: bill.autoRenew || false,
            gracePeriodDays: bill.gracePeriodDays || 0,
            internalNotes: bill.internalNotes,
          },
        })

        // Restore payments for this bill
        if (bill.payments) {
          for (const payment of bill.payments) {
            await prisma.recurringBillPayment.upsert({
              where: { id: payment.id },
              update: {
                amount: payment.amount,
                paymentDate: new Date(payment.paymentDate),
              },
              create: {
                id: payment.id,
                recurringBillId: bill.id,
                companyId,
                amount: payment.amount,
                paymentDate: new Date(payment.paymentDate),
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes,
                outstandingAfterPayment: payment.outstandingAfterPayment || 0,
              },
            })
          }
        }
      }
    }

    // Restore recurring bill payments (standalone)
    if (body.data?.recurringBillPayments) {
      for (const payment of body.data.recurringBillPayments) {
        await prisma.recurringBillPayment.upsert({
          where: { id: payment.id },
          update: {
            amount: payment.amount,
            paymentDate: new Date(payment.paymentDate),
          },
          create: {
            id: payment.id,
            recurringBillId: payment.recurringBillId,
            companyId,
            amount: payment.amount,
            paymentDate: new Date(payment.paymentDate),
            method: payment.method,
            reference: payment.reference,
            notes: payment.notes,
            outstandingAfterPayment: payment.outstandingAfterPayment || 0,
          },
        })
      }
    }

    // Restore bill reminders
    if (body.data?.billReminders) {
      for (const reminder of body.data.billReminders) {
        await prisma.billReminder.upsert({
          where: { id: reminder.id },
          update: {
            message: reminder.message,
            isRead: reminder.isRead,
          },
          create: {
            id: reminder.id,
            recurringBillId: reminder.recurringBillId,
            companyId,
            type: reminder.type,
            message: reminder.message,
            isRead: reminder.isRead || false,
            isSent: reminder.isSent || false,
            sentVia: reminder.sentVia,
          },
        })
      }
    }

    // Log the restore completion
    await createAuditLog({
      action: 'RESTORE_COMPLETE',
      entity: 'Company',
      entityId: companyId,
      userId: user.id,
      companyId,
      details: summary,
    })

    return successResponse({
      message: 'Backup restored successfully',
      summary,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return errorResponse('Failed to restore backup', 500)
  }
}
