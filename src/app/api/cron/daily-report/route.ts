import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { safeNumber } from '@/lib/api-utils'

// Vercel Cron Job endpoint - generates daily report at midnight Dubai time (Asia/Dubai = UTC+4)
// PHASE 1 FIX: Uses aggregate() instead of findMany + reduce — safe at scale
// PHASE 2 FIX: Uses Promise.allSettled() with per-company error isolation
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request
    // Vercel Cron sends Authorization: Bearer <CRON_SECRET> (if configured)
    // Also accept Vercel's internal cron header as fallback
    const authHeader = request.headers.get('authorization')
    const vercelCronHeader = request.headers.get('x-vercel-cron')
    const isVercelCron = vercelCronHeader === 'true'

    if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date in Dubai timezone
    const dubaiDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' })

    // Get all active companies (only IDs and names — lightweight)
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    })

    const startOfDay = new Date(dubaiDate + 'T00:00:00.000Z')
    const endOfDay = new Date(dubaiDate + 'T23:59:59.999Z')

    // PHASE 2: Process all companies in parallel with Promise.allSettled()
    // One failing company does NOT break the entire execution cycle
    const settledResults = await Promise.allSettled(
      companies.map(async (company) => {
        try {
          // Use aggregate() instead of findMany — no data loading into memory
          const [incomeResult, expensesResult] = await Promise.all([
            prisma.payment.aggregate({
              where: {
                date: { gte: startOfDay, lte: endOfDay },
                companyId: company.id,
              },
              _sum: { amount: true },
            }),
            prisma.expense.aggregate({
              where: {
                date: { gte: startOfDay, lte: endOfDay },
                deletedAt: null,
                companyId: company.id,
              },
              _sum: { amount: true },
            }),
          ])

          const totalIncome = safeNumber(incomeResult._sum.amount)
          const totalExpenses = safeNumber(expensesResult._sum.amount)

          // Create a notification for the daily report
          await prisma.notification.create({
            data: {
              companyId: company.id,
              type: 'daily_report',
              title: `Daily Report - ${dubaiDate}`,
              message: `Income: AED ${totalIncome.toFixed(2)} | Expenses: AED ${totalExpenses.toFixed(2)} | Net: AED ${(totalIncome - totalExpenses).toFixed(2)}`,
              data: JSON.stringify({
                date: dubaiDate,
                totalIncome,
                totalExpenses,
                netProfitLoss: totalIncome - totalExpenses,
              }),
            },
          })

          return {
            companyId: company.id,
            companyName: company.name,
            date: dubaiDate,
            totalIncome,
            totalExpenses,
            netProfitLoss: totalIncome - totalExpenses,
          }
        } catch (companyError) {
          // Per-company error isolation — log and throw to be caught by allSettled
          console.error(`Cron error for company ${company.id} (${company.name}):`, companyError)
          throw new Error(`Company ${company.name} failed: ${companyError instanceof Error ? companyError.message : 'Unknown error'}`)
        }
      })
    )

    // Separate successful and failed results
    const results: Array<{
      companyId: string
      companyName: string
      date: string
      totalIncome: number
      totalExpenses: number
      netProfitLoss: number
    }> = []

    const errors: Array<{ companyId: string; companyName: string; error: string }> = []

    settledResults.forEach((result, index) => {
      const company = companies[index]
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        errors.push({
          companyId: company.id,
          companyName: company.name,
          error: result.reason?.message || 'Unknown error',
        })
      }
    })

    return NextResponse.json({
      success: errors.length === 0,
      date: dubaiDate,
      companiesProcessed: results.length,
      companiesFailed: errors.length,
      results,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('Cron daily report error:', error)
    return NextResponse.json({ error: 'Failed to generate daily reports' }, { status: 500 })
  }
}
