import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  isFinancialUser,
  forbiddenResponse,
  errorResponse,
  successResponse,
} from '@/lib/api-utils'

// GET /api/reports?month=X&year=Y — P&L report data (owner/admin only)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    // Only owner/admin can access reports
    if (!isFinancialUser(user.role)) {
      return forbiddenResponse('Only owners and admins can view reports')
    }

    const companyId = user.companyId

    // Parse query params
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const targetMonth = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
    const targetYear = parseInt(searchParams.get('year') || String(now.getFullYear()))

    // Fetch all active tenants with payments for the company
    const tenants = await prisma.tenant.findMany({
      where: { companyId, deletedAt: null, status: 'active' },
      include: { payments: true, property: true },
    })

    // Fetch all payments for the company (needed for trend)
    const allPayments = await prisma.payment.findMany({
      where: { tenant: { companyId } },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
            phone: true,
            rentAmount: true,
            propertyId: true,
          },
        },
      },
    })

    // Fetch all expenses for the company
    const expenses = await prisma.expense.findMany({
      where: { companyId, deletedAt: null },
    })

    // Fetch properties for unit counts
    const properties = await prisma.property.findMany({
      where: { companyId, deletedAt: null },
    })

    // --- Revenue calculations for target month ---
    const monthlyPayments = allPayments.filter(
      (p) => p.month === targetMonth && p.year === targetYear
    )
    const totalRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    const expectedRevenue = tenants.reduce((sum, t) => sum + t.rentAmount, 0)

    // Rental income = total collected rent
    const rentalIncome = totalRevenue

    // Other income (non-rent payments — currently 0, can be expanded)
    const otherIncome = 0

    // Gross revenue
    const grossRevenue = rentalIncome + otherIncome

    // --- Expense calculations for target month ---
    const monthlyExpenses = expenses.filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
    })
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Expense breakdown by category
    const expenseBreakdown: Record<string, number> = {}
    for (const e of monthlyExpenses) {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount
    }

    // --- Occupancy calculations ---
    const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
    const occupiedUnits = tenants.length
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    // --- Vacancy loss ---
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits)
    const avgRent =
      tenants.length > 0
        ? tenants.reduce((sum, t) => sum + t.rentAmount, 0) / tenants.length
        : 0
    const vacancyLoss = vacantUnits * avgRent

    // --- Bad debt: uncollected rent from active tenants ---
    const badDebt = Math.max(0, expectedRevenue - totalRevenue)

    // --- P&L calculations ---
    const costOfOperations = totalExpenses
    const grossProfit = grossRevenue - vacancyLoss - badDebt
    const netIncome = grossProfit - costOfOperations
    const profitLoss = totalRevenue - totalExpenses

    // --- Collection rate ---
    const collectionRate =
      expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0

    // --- 6-month trend ---
    const trend: any[] = []
    for (let i = 5; i >= 0; i--) {
      let m = targetMonth - i
      let y = targetYear
      if (m <= 0) {
        m += 12
        y -= 1
      }

      const mPayments = allPayments.filter((p) => p.month === m && p.year === y)
      const rev = mPayments.reduce((sum, p) => sum + p.amount, 0)

      const mExpenses = expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      const exp = mExpenses.reduce((sum, e) => sum + e.amount, 0)

      trend.push({ month: m, year: y, revenue: rev, expenses: exp, profit: rev - exp })
    }

    const data = {
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
      monthlyExpenses: monthlyExpenses.map((e) => serialize(e)),
      trend,
      // P&L fields
      rentalIncome,
      otherIncome,
      grossRevenue,
      vacancyLoss,
      badDebt,
      grossProfit,
      costOfOperations,
      netIncome,
    }

    return successResponse(data)
  } catch (error) {
    console.error('Reports error:', error)
    return errorResponse('Failed to fetch report data', 500)
  }
}
