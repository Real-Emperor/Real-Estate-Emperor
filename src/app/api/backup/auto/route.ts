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

// Conditionally import @vercel/blob
let put: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const blobModule = require('@vercel/blob')
  put = blobModule.put
} catch {
  // @vercel/blob not available — graceful fallback
}

// GET /api/backup/auto — Trigger automated backup (called by Vercel Cron or manually)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const cronSecret = url.searchParams.get('cron_secret')
    const isCron = request.headers.get('x-vercel-cron') === 'true'

    let triggeredBy = 'system'

    // Validate cron secret for automated calls
    if (isCron) {
      if (cronSecret !== process.env.CRON_SECRET) {
        return errorResponse('Invalid cron secret', 403)
      }
    } else {
      // Manual trigger requires auth
      const user = await getAuthUser()
      if (!user) return unauthorizedResponse()
      if (user.role !== 'owner' && user.role !== 'admin') {
        return forbiddenResponse('Only owners and admins can create backups')
      }
      triggeredBy = user.id
    }

    // Get all companies (for cron job, back up all; for manual, only the user's company)
    let companyIds: string[] = []

    if (isCron) {
      const companies = await prisma.company.findMany({ select: { id: true } })
      companyIds = companies.map(c => c.id)
    } else {
      const user = await getAuthUser()
      if (user) {
        companyIds = [user.companyId]
      }
    }

    const results: Array<{
      companyId: string
      companyName?: string
      size?: number
      recordCount?: number
      status: string
      error?: string
      storageUrl?: string | null
      dataHash?: string
    }> = []

    for (const companyId of companyIds) {
      try {
        // Fetch all company data
        const [company, properties, tenants, expenses, maintenance, users, auditLogs] = await Promise.all([
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
              id: true, email: true, name: true, nameAr: true, nameBn: true, nameUr: true,
              role: true, isActive: true, createdAt: true,
            },
          }),
          prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          }),
        ])

        // Also fetch soft-deleted records
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
          version: '1.1',
          exportedAt: new Date().toISOString(),
          type: isCron ? 'auto' : 'manual',
          company,
          data: { properties, tenants, expenses, maintenance, users, auditLogs },
          deleted: { properties: deletedProperties, tenants: deletedTenants, expenses: deletedExpenses, maintenance: deletedMaintenance },
        }

        const backupJson = JSON.stringify(backup)
        const backupSize = Buffer.byteLength(backupJson, 'utf-8')
        const recordCount = properties.length + tenants.length + expenses.length + maintenance.length + users.length

        // Compute SHA-256 data hash for integrity verification
        const dataHash = crypto.createHash('sha256').update(backupJson).digest('hex')

        // Attempt to persist backup to Vercel Blob
        let storageUrl: string | null = null
        if (put && process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const date = new Date().toISOString().split('T')[0]
            const blobKey = `backups/${companyId}/${date}.json`
            const blobResult = await put(blobKey, backupJson, {
              access: 'public',
              contentType: 'application/json',
            })
            storageUrl = blobResult.url
          } catch (blobErr: any) {
            console.warn(`Failed to upload backup to Vercel Blob for company ${companyId}:`, blobErr.message)
            // Graceful fallback — continue without storageUrl
          }
        }

        // Create backup record
        await prisma.backupRecord.create({
          data: {
            companyId,
            type: isCron ? 'auto' : 'manual',
            size: backupSize,
            recordCount,
            status: 'completed',
            storageUrl,
            dataHash,
            triggeredBy,
          },
        })

        // Clean up old auto-backups (keep last 90 days instead of 30)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        await prisma.backupRecord.deleteMany({
          where: {
            companyId,
            type: 'auto',
            createdAt: { lt: ninetyDaysAgo },
          },
        })

        // Log the backup
        await createAuditLog({
          action: 'AUTO_BACKUP',
          entity: 'Company',
          entityId: companyId,
          userId: triggeredBy,
          companyId,
          details: {
            type: isCron ? 'auto' : 'manual',
            size: backupSize,
            recordCount,
            dataHash,
            storageUrl,
            properties: properties.length,
            tenants: tenants.length,
            expenses: expenses.length,
            maintenance: maintenance.length,
          },
        })

        results.push({
          companyId,
          companyName: company?.name,
          size: backupSize,
          recordCount,
          status: 'completed',
          storageUrl,
          dataHash,
        })
      } catch (err: any) {
        // Record failed backup
        await prisma.backupRecord.create({
          data: {
            companyId,
            type: isCron ? 'auto' : 'manual',
            size: 0,
            recordCount: 0,
            status: 'failed',
            error: err.message || 'Unknown error',
            triggeredBy,
          },
        }).catch(() => {})

        results.push({
          companyId,
          status: 'failed',
          error: err.message,
        })
      }
    }

    return successResponse({
      message: `Backup completed for ${results.length} company(ies)`,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Auto backup error:', error)
    return errorResponse('Failed to create backup', 500)
  }
}
