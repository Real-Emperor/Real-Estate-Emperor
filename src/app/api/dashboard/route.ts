import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  isFinancialUser,
  errorResponse,
  successResponse,
  safeNumber,
} from '@/lib/api-utils'

// GET /api/dashboard — aggregated dashboard data for the authenticated user's company
// PHASE 1 FIX: Uses Prisma aggregate(), groupBy(), count() — NO full-table data loading
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const companyId = user.companyId
    const financialAccess = isFinancialUser(user.role)

    // Get current month/year
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // ─── 1. Company info (single row, no scan) ───
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameBn: true,
        nameUr: true,
        phone: true,
        email: true,
        address: true,
      },
    })

    // ─── 2. Stats via count() and aggregate() — no row fetching ───
    const [
      totalTenantsCount,
      activeTenantsCount,
      totalPropertiesCount,
      totalUnitsAggregate,
      occupiedUnitsAggregate,
      currentMonthPaidAggregate,
      expectedRevenueAggregate,
    ] = await Promise.all([
      // Total non-deleted tenants
      prisma.tenant.count({
        where: { companyId, deletedAt: null },
      }),

      // Active tenants count
      prisma.tenant.count({
        where: { companyId, deletedAt: null, status: 'active' },
      }),

      // Non-deleted properties count
      prisma.property.count({
        where: { companyId, deletedAt: null },
      }),

      // Total units across all properties
      prisma.property.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalUnits: true },
      }),

      // Occupied units = active tenants count
      prisma.tenant.count({
        where: { companyId, deletedAt: null, status: 'active' },
      }),

      // Current month collected revenue via aggregate
      prisma.payment.aggregate({
        where: {
          tenant: { companyId },
          month: currentMonth,
          year: currentYear,
        },
        _sum: { amount: true },
      }),

      // Expected revenue = sum of rentAmount for active tenants
      prisma.tenant.aggregate({
        where: { companyId, deletedAt: null, status: 'active' },
        _sum: { rentAmount: true },
      }),
    ])

    const expectedRevenue = safeNumber(expectedRevenueAggregate._sum.rentAmount)
    const collectedRevenue = safeNumber(currentMonthPaidAggregate._sum.amount)
    const totalUnits = safeNumber(totalUnitsAggregate._sum.totalUnits)
    const occupiedUnits = occupiedUnitsAggregate
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    // ─── 3. Current month expenses — aggregate only (FIX: filter for current month) ───
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    const currentMonthExpensesAggregate = await prisma.expense.aggregate({
      where: {
        companyId,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })
    const totalExpenses = safeNumber(currentMonthExpensesAggregate._sum.amount)
    const netProfit = collectedRevenue - totalExpenses

    // ─── 4. Overdue & partial tenants — lightweight query (IDs + rent only) ───
    // Find tenants who have paid this month (just tenantId)
    const paidTenantIds = await prisma.payment.findMany({
      where: {
        tenant: { companyId },
        month: currentMonth,
        year: currentYear,
      },
      select: { tenantId: true, amount: true },
    })

    // Build a map of tenantId -> total paid this month
    const paidMap = new Map<string, number>()
    for (const p of paidTenantIds) {
      paidMap.set(p.tenantId, (paidMap.get(p.tenantId) || 0) + p.amount)
    }

    // Active tenants (lightweight — only fields needed for overdue calc)
    const activeTenants = await prisma.tenant.findMany({
      where: { companyId, deletedAt: null, status: 'active' },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameBn: true,
        nameUr: true,
        phone: true,
        unitNumber: true,
        rentAmount: true,
        municipalityFee: true,
        securityDeposit: true,
        newRent: true,
        propertyId: true,
        status: true,
        latePaymentCount: true,
        tenantScore: true,
        payments: {
          where: { month: currentMonth, year: currentYear },
          select: { id: true, amount: true },
        },
        property: {
          select: { id: true, name: true },
        },
      },
    })

    const overdueTenants = activeTenants.filter((t) => !paidMap.has(t.id))
    const partialTenants = activeTenants.filter((t) => {
      const totalPaid = paidMap.get(t.id) || 0
      return totalPaid > 0 && totalPaid < t.rentAmount
    })

    const overdueAmount =
      overdueTenants.reduce((sum, t) => sum + t.rentAmount, 0) +
      partialTenants.reduce((sum, t) => {
        const paid = paidMap.get(t.id) || 0
        return sum + (t.rentAmount - paid)
      }, 0)

    // ─── 5. Chart data — last 6 months via groupBy (NO full-table scan) ───
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const chartMonths: Array<{ month: number; year: number }> = []
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i
      let y = currentYear
      if (m <= 0) {
        m += 12
        y -= 1
      }
      chartMonths.push({ month: m, year: y })
    }

    // Use groupBy to get collected revenue per month
    const paymentByMonth = await prisma.payment.groupBy({
      by: ['month', 'year'],
      where: {
        tenant: { companyId },
        month: { in: chartMonths.map((c) => c.month) },
        year: { in: chartMonths.map((c) => c.year) },
      },
      _sum: { amount: true },
    })

    // Build lookup map from groupBy result
    const paymentByMonthMap = new Map<string, number>()
    for (const row of paymentByMonth) {
      const key = `${row.month}-${row.year}`
      paymentByMonthMap.set(key, safeNumber(row._sum.amount))
    }

    const chartData = chartMonths.map(({ month, year }) => ({
      month: monthNames[month - 1],
      expected: expectedRevenue,
      collected: paymentByMonthMap.get(`${month}-${year}`) || 0,
    }))

    // ─── 6. Recent payments — top 10 only (bounded) ───
    const recentPayments = await prisma.payment.findMany({
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
      orderBy: { date: 'desc' },
      take: 10,
    })

    // ─── 7. Due soon ───
    const dayOfMonth = now.getDate()
    const dueSoon = dayOfMonth <= 5 ? overdueTenants : []

    // ─── 8. Properties with tenant counts — lightweight ───
    const properties = await prisma.property.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameBn: true,
        nameUr: true,
        type: true,
        address: true,
        totalUnits: true,
        floors: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        tenants: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    })

    const propertiesWithCounts = properties.map((p) => {
      const { tenants, ...propertyData } = p
      return {
        ...propertyData,
        tenantCount: tenants.length,
        activeTenantCount: tenants.filter((t) => t.status === 'active').length,
      }
    })

    // ─── 9. Maintenance items — only recent/active (bounded to 50) ───
    const maintenanceItems = await prisma.maintenance.findMany({
      where: { companyId, deletedAt: null, status: { not: 'completed' } },
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // ─── 10. Expenses — only current month for dashboard (bounded) ───
    const expensesThisMonth = await prisma.expense.findMany({
      where: {
        companyId,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: 'desc' },
      take: 50,
    })

    // ─── Build response ───
    const financialMask = (obj: any, fields: string[]) => {
      if (financialAccess) return serialize(obj)
      const masked = { ...serialize(obj) }
      for (const f of fields) {
        if (f in masked) masked[f] = 0
      }
      return masked
    }

    const data = {
      company,
      stats: {
        expectedRevenue: financialAccess ? expectedRevenue : 0,
        collectedRevenue: financialAccess ? collectedRevenue : 0,
        overdueCount: overdueTenants.length,
        overdueAmount: financialAccess ? overdueAmount : 0,
        activeTenants: activeTenantsCount,
        totalTenants: totalTenantsCount,
        occupancyRate,
        totalUnits,
        occupiedUnits,
        partialCount: partialTenants.length,
        netProfit: financialAccess ? netProfit : 0,
        totalExpenses: financialAccess ? totalExpenses : 0,
      },
      overdueTenants: overdueTenants.map((t) =>
        financialMask(t, ['rentAmount', 'municipalityFee', 'securityDeposit', 'newRent'])
      ),
      partialTenants: partialTenants.map((t) =>
        financialMask(t, ['rentAmount', 'municipalityFee', 'securityDeposit', 'newRent'])
      ),
      dueSoon: dueSoon.map((t) =>
        financialMask(t, ['rentAmount', 'municipalityFee', 'securityDeposit', 'newRent'])
      ),
      activeTenantsList: activeTenants.map((t) =>
        financialMask(t, ['rentAmount', 'municipalityFee', 'securityDeposit', 'newRent'])
      ),
      recentPayments: financialAccess
        ? recentPayments.map((p) => serialize(p))
        : recentPayments.map(({ amount, ...rest }) => ({
            ...serialize(rest),
            amount: 0,
          })),
      chartData: financialAccess
        ? chartData
        : chartData.map((d) => ({ month: d.month, expected: 0, collected: 0 })),
      properties: propertiesWithCounts.map((p) => serialize(p)),
      expenses: financialAccess
        ? expensesThisMonth.map((e) => serialize(e))
        : expensesThisMonth.map(({ amount, ...rest }) => ({
            ...serialize(rest),
            amount: 0,
          })),
      maintenanceItems: maintenanceItems.map((m) => serialize(m)),
    }

    return successResponse(data)
  } catch (error) {
    console.error('Dashboard error:', error)
    return errorResponse('Failed to fetch dashboard data', 500)
  }
}
