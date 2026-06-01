import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Vercel Cron Job endpoint - generates daily report at midnight Dubai time (Asia/Dubai = UTC+4)
// This endpoint is called by Vercel's cron scheduler
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (Vercel sends specific headers)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date in Dubai timezone
    const dubaiDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' })

    // Get all active companies
    const companies = await prisma.company.findMany()

    const results: Array<{
      companyId: string
      companyName: string
      date: string
      totalIncome: number
      totalExpenses: number
      netProfitLoss: number
    }> = []

    for (const company of companies) {
      const startOfDay = new Date(dubaiDate + 'T00:00:00.000Z')
      const endOfDay = new Date(dubaiDate + 'T23:59:59.999Z')

      // Fetch payments for the day
      const payments = await prisma.payment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          tenant: { companyId: company.id },
        },
        include: { tenant: { include: { property: true } } },
      })

      // Fetch expenses for the day
      const expenses = await prisma.expense.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          deletedAt: null,
          companyId: company.id,
        },
      })

      const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

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
            paymentCount: payments.length,
            expenseCount: expenses.length,
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
