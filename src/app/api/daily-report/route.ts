import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const companyId = searchParams.get('companyId')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Parse the date for filtering (start and end of day in UTC)
    const startOfDay = new Date(date + 'T00:00:00.000Z')
    const endOfDay = new Date(date + 'T23:59:59.999Z')

    // Fetch payments for the day (with tenant info)
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        tenant: companyId ? {
          companyId: companyId,
        } : undefined,
      },
      include: {
        tenant: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Fetch expenses for the day
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deletedAt: null,
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { date: 'desc' },
    })

    // Calculate totals
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfitLoss = totalIncome - totalExpenses

    // Expense category breakdown
    const expenseBreakdown: Record<string, number> = {}
    for (const e of expenses) {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount
    }

    // Format income items
    const incomeItems = payments.map(p => ({
      tenantName: p.tenant?.name || 'Unknown',
      propertyName: p.tenant?.property?.name || '',
      unitNumber: p.tenant?.unitNumber || null,
      amount: p.amount,
      time: new Date(p.date).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
      method: p.method,
    }))

    // Format expense items
    const expenseItems = expenses.map(e => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      vendor: e.vendor,
      time: new Date(e.date).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
    }))

    return NextResponse.json({
      date,
      totalIncome,
      totalExpenses,
      netProfitLoss,
      expenseBreakdown,
      incomeItems,
      expenseItems,
    })
  } catch (error) {
    console.error('Daily report API error:', error)
    return NextResponse.json({ error: 'Failed to generate daily report' }, { status: 500 })
  }
}
