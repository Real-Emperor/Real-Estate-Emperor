import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  isFinancialUser,
  forbiddenResponse,
  errorResponse,
  successResponse,
  safeNumber,
} from '@/lib/api-utils'

// GET /api/reports?month=X&year=Y — P&L report data (owner/admin only)
// PHASE 1 FIX: Uses Prisma aggregate() and groupBy() — NO full-table data loading
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

    // ─── 1. Revenue via aggregate — NO findMany ───
    const [totalRevenueResult, expectedRevenueResult] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          tenant: { companyId },
          month: targetMonth,
          year: targetYear,
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tenant.aggregate({
        where: { companyId, deletedAt: null, status: 'active' },
        _sum: { rentAmount: true },
        _count: true,
      }),
    ])

    const totalRevenue = safeNumber(totalRevenueResult._sum.amount)
    const expectedRevenue = safeNumber(expectedRevenueResult._sum.rentAmount)
    const activeTenantCount = expectedRevenueResult._count

    // ─── 2. Expenses via aggregate — filter for target month only ───
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    const [totalExpensesResult, expenseBreakdownResult] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          companyId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: {
          companyId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
    ])

    const totalExpenses = safeNumber(totalExpensesResult._sum.amount)

    // Build expense breakdown from groupBy
    const expenseBreakdown: Record<string, number> = {}
    for (const row of expenseBreakdownResult) {
      expenseBreakdown[row.category] = safeNumber(row._sum.amount)
    }

    // ─── 3. Occupancy via aggregate ───
    const [totalUnitsResult, occupiedCount] = await Promise.all([
      prisma.property.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalUnits: true },
      }),
      prisma.tenant.count({
        where: { companyId, deletedAt: null, status: 'active' },
      }),
    ])

    const totalUnits = safeNumber(totalUnitsResult._sum.totalUnits)
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0

    // ─── 4. Vacancy loss & bad debt ───
    const vacantUnits = Math.max(0, totalUnits - occupiedCount)
    const avgRent = activeTenantCount > 0 ? expectedRevenue / activeTenantCount : 0
    const vacancyLoss = vacantUnits * avgRent
    const badDebt = Math.max(0, expectedRevenue - totalRevenue)

    // ─── 5. P&L calculations ───
    const rentalIncome = totalRevenue
    const otherIncome = 0
    const grossRevenue = rentalIncome + otherIncome
    const grossProfit = grossRevenue - vacancyLoss - badDebt
    const costOfOperations = totalExpenses
    const netIncome = grossProfit - costOfOperations
    const profitLoss = totalRevenue - totalExpenses
    const collectionRate = expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0

    // ─── 6. 6-month trend via groupBy — NO full-table scan ───
    const chartMonths: Array<{ month: number; year: number }> = []
    for (let i = 5; i >= 0; i--) {
      let m = targetMonth - i
      let y = targetYear
      if (m <= 0) {
        m += 12
        y -= 1
      }
      chartMonths.push({ month: m, year: y })
    }

    const [paymentTrend, expenseDetails] = await Promise.all([
      prisma.payment.groupBy({
        by: ['month', 'year'],
        where: {
          tenant: { companyId },
          month: { in: chartMonths.map((c) => c.month) },
          year: { in: chartMonths.map((c) => c.year) },
        },
        _sum: { amount: true },
      }),
      // Expense model has no month/year fields — fetch amounts by date range and group in JS
      prisma.expense.findMany({
        where: {
          companyId,
          deletedAt: null,
          date: {
            gte: new Date(chartMonths[0].year, chartMonths[0].month - 1, 1),
            lte: new Date(
              chartMonths[chartMonths.length - 1].year,
              chartMonths[chartMonths.length - 1].month,
              0,
              23,
              59,
              59,
              999
            ),
          },
        },
        select: { date: true, amount: true },
      }),
    ])

    // Build lookup maps
    const paymentMap = new Map<string, number>()
    for (const row of paymentTrend) {
      paymentMap.set(`${row.month}-${row.year}`, safeNumber(row._sum.amount))
    }

    // Group expense amounts by month/year derived from date
    const expenseMap = new Map<string, number>()
    for (const row of expenseDetails) {
      const d = new Date(row.date)
      const key = `${d.getMonth() + 1}-${d.getFullYear()}`
      expenseMap.set(key, (expenseMap.get(key) || 0) + safeNumber(row.amount))
    }

    const trend = chartMonths.map(({ month, year }) => {
      const rev = paymentMap.get(`${month}-${year}`) || 0
      const exp = expenseMap.get(`${month}-${year}`) || 0
      return { month, year, revenue: rev, expenses: exp, profit: rev - exp }
    })

    // ─── 7. Monthly expense details (bounded, paginated) ───
    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        companyId,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

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
      occupiedUnits: occupiedCount,
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
