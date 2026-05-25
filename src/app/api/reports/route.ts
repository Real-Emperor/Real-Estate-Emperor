import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const tenants = await db.tenant.findMany({
      where: { companyId: company.id, status: 'active' },
      include: { payments: true, property: true },
    })

    const expenses = await db.expense.findMany({
      where: { companyId: company.id },
    })

    const now = new Date()
    const targetMonth = month || now.getMonth() + 1
    const targetYear = year || now.getFullYear()

    // Revenue for target month
    const monthlyPayments = tenants.flatMap(t => t.payments).filter(p => p.month === targetMonth && p.year === targetYear)
    const totalRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    const expectedRevenue = tenants.reduce((sum, t) => sum + t.rentAmount, 0)

    // Expenses for target month
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
    })
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Expense breakdown
    const expenseBreakdown: Record<string, number> = {}
    for (const e of monthlyExpenses) {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount
    }

    const profitLoss = totalRevenue - totalExpenses

    // Occupancy
    const properties = await db.property.findMany({ where: { companyId: company.id } })
    const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
    const occupiedUnits = tenants.length
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    // Collection rate
    const collectionRate = expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0

    // 6-month trend
    const trend = []
    for (let i = 5; i >= 0; i--) {
      let m = targetMonth - i
      let y = targetYear
      if (m <= 0) { m += 12; y -= 1 }

      const mPayments = tenants.flatMap(t => t.payments).filter(p => p.month === m && p.year === y)
      const rev = mPayments.reduce((sum, p) => sum + p.amount, 0)

      const mExpenses = expenses.filter(e => {
        const d = new Date(e.date)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      const exp = mExpenses.reduce((sum, e) => sum + e.amount, 0)

      trend.push({ month: m, year: y, revenue: rev, expenses: exp, profit: rev - exp })
    }

    return NextResponse.json({
      month: targetMonth,
      year: targetYear,
      totalRevenue,
      expectedRevenue,
      totalExpenses,
      profitLoss,
      occupancyRate,
      collectionRate,
      totalUnits,
      occupiedUnits,
      expenseBreakdown,
      monthlyExpenses,
      trend,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
