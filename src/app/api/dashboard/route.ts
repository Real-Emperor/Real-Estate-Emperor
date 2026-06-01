import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  isFinancialUser,
  errorResponse,
  successResponse,
} from '@/lib/api-utils'

// GET /api/dashboard — aggregated dashboard data for the authenticated user's company
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

    // Fetch company
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

    // Fetch all data for the company
    const properties = await prisma.property.findMany({
      where: { companyId, deletedAt: null },
      include: { tenants: { where: { deletedAt: null } } },
    })

    const tenants = await prisma.tenant.findMany({
      where: { companyId, deletedAt: null },
      include: { payments: true, property: true },
    })

    const payments = await prisma.payment.findMany({
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

    const expenses = await prisma.expense.findMany({
      where: { companyId, deletedAt: null },
    })

    const maintenanceItems = await prisma.maintenance.findMany({
      where: { companyId, deletedAt: null },
      include: { property: true },
    })

    // Calculate stats
    const activeTenants = tenants.filter((t) => t.status === 'active')
    const expectedRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)
    const currentMonthPayments = payments.filter(
      (p) => p.month === currentMonth && p.year === currentYear
    )
    const collectedRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0)

    // Overdue tenants (active tenants who haven't paid current month)
    const overdueTenants = activeTenants.filter(
      (t) =>
        !payments.some((p) => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear)
    )

    // Partial tenants (active tenants who paid less than rent amount this month)
    const partialTenants = activeTenants.filter((t) => {
      const monthPayments = payments.filter(
        (p) => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear
      )
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
      return totalPaid > 0 && totalPaid < t.rentAmount
    })

    const overdueAmount =
      overdueTenants.reduce((sum, t) => sum + t.rentAmount, 0) +
      partialTenants.reduce((sum, t) => {
        const paid = payments
          .filter((p) => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear)
          .reduce((s, p) => s + p.amount, 0)
        return sum + (t.rentAmount - paid)
      }, 0)

    const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
    const occupiedUnits = activeTenants.length
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = collectedRevenue - totalExpenses

    // Chart data - last 6 months
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const chartData: any[] = []
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i
      let y = currentYear
      if (m <= 0) {
        m += 12
        y -= 1
      }
      const monthCollected = payments
        .filter((p) => p.month === m && p.year === y)
        .reduce((sum, p) => sum + p.amount, 0)
      chartData.push({
        month: monthNames[m - 1],
        expected: expectedRevenue,
        collected: monthCollected,
      })
    }

    // Recent payments (top 10 by date descending)
    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    // Due soon: within first 5 days of month, show overdue tenants
    const dayOfMonth = now.getDate()
    const dueSoon = dayOfMonth <= 5 ? overdueTenants : []

    // Build response
    const data = {
      company,
      stats: {
        expectedRevenue: financialAccess ? expectedRevenue : 0,
        collectedRevenue: financialAccess ? collectedRevenue : 0,
        overdueCount: overdueTenants.length,
        overdueAmount: financialAccess ? overdueAmount : 0,
        activeTenants: activeTenants.length,
        totalTenants: tenants.length,
        occupancyRate,
        totalUnits,
        occupiedUnits,
        partialCount: partialTenants.length,
        netProfit: financialAccess ? netProfit : 0,
        totalExpenses: financialAccess ? totalExpenses : 0,
      },
      overdueTenants: financialAccess
        ? overdueTenants.map((t) => serialize(t))
        : overdueTenants.map(({ payments: _p, rentAmount, municipalityFee, securityDeposit, newRent, ...rest }) => ({
            ...serialize(rest),
            rentAmount: 0,
            municipalityFee: 0,
            securityDeposit: 0,
            newRent: 0,
          })),
      partialTenants: financialAccess
        ? partialTenants.map((t) => serialize(t))
        : partialTenants.map(({ payments: _p, rentAmount, municipalityFee, securityDeposit, newRent, ...rest }) => ({
            ...serialize(rest),
            rentAmount: 0,
            municipalityFee: 0,
            securityDeposit: 0,
            newRent: 0,
          })),
      dueSoon: financialAccess
        ? dueSoon.map((t) => serialize(t))
        : dueSoon.map(({ payments: _p, rentAmount, municipalityFee, securityDeposit, newRent, ...rest }) => ({
            ...serialize(rest),
            rentAmount: 0,
            municipalityFee: 0,
            securityDeposit: 0,
            newRent: 0,
          })),
      activeTenantsList: financialAccess
        ? activeTenants.map((t) => serialize(t))
        : activeTenants.map(({ payments: _p, rentAmount, municipalityFee, securityDeposit, newRent, ...rest }) => ({
            ...serialize(rest),
            rentAmount: 0,
            municipalityFee: 0,
            securityDeposit: 0,
            newRent: 0,
          })),
      recentPayments: financialAccess
        ? recentPayments.map((p) => serialize(p))
        : recentPayments.map(({ amount, ...rest }) => ({
            ...serialize(rest),
            amount: 0,
          })),
      chartData: financialAccess
        ? chartData
        : chartData.map((d) => ({ month: d.month, expected: 0, collected: 0 })),
      properties: properties.map((p) => serialize(p)),
      expenses: financialAccess
        ? expenses.map((e) => serialize(e))
        : expenses.map(({ amount, ...rest }) => ({
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
