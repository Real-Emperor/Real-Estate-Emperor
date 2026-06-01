import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { safeNumber } from '@/lib/api-utils'

// Vercel Cron Job endpoint - generates daily report at midnight Dubai time (Asia/Dubai = UTC+4)
// PHASE 1 FIX: Uses aggregate() instead of findMany + reduce — safe at scale
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (Vercel sends specific headers)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    const results: Array<{
      companyId: string
      companyName: string
      date: string
      totalIncome: number
      totalExpenses: number
      netProfitLoss: number
    }> = []

    for (const company of companies) {
      // Use aggregate() instead of findMany — no data loading into memory
      const [incomeResult, expensesResult] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            date: { gte: startOfDay, lte: endOfDay },
            tenant: { companyId: company.id },
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

      results.push({
        companyId: company.id,
        companyName: company.name,
        date: dubaiDate,
        totalIncome,
        totalExpenses,
        netProfitLoss: totalIncome - totalExpenses,
      })
    }

    return NextResponse.json({
      success: true,
      date: dubaiDate,
      companiesProcessed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron daily report error:', error)
    return NextResponse.json({ error: 'Failed to generate daily reports' }, { status: 500 })
  }
}
