import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const tenants = await db.tenant.findMany({
      where: { companyId: company.id },
      include: {
        payments: true,
        property: true,
      },
    })

    const properties = await db.property.findMany({
      where: { companyId: company.id },
      include: {
        tenants: { where: { status: 'active' } },
      },
    })

    const payments = await db.payment.findMany({
      where: { tenant: { companyId: company.id } },
      include: { tenant: { include: { property: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    })

    const expenses = await db.expense.findMany({
      where: { companyId: company.id },
    })

    const maintenanceItems = await db.maintenance.findMany({
      where: { companyId: company.id },
    })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Active tenants
    const activeTenants = tenants.filter(t => t.status === 'active')

    // Total expected monthly revenue
    const expectedRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)

    // Current month payments
    const currentMonthPayments = tenants.flatMap(t => t.payments).filter(p => p.month === currentMonth && p.year === currentYear)
    const collectedRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0)

    // Overdue tenants (active, haven't paid current month)
    const overdueTenants = activeTenants.filter(t => {
      const hasPaid = t.payments.some(p => p.month === currentMonth && p.year === currentYear)
      return !hasPaid
    })

    // Partially paid tenants
    const partialTenants = activeTenants.filter(t => {
      const monthPayments = t.payments.filter(p => p.month === currentMonth && p.year === currentYear)
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
      return totalPaid > 0 && totalPaid < t.rentAmount
    })

    const overdueAmount = overdueTenants.reduce((sum, t) => sum + t.rentAmount, 0)
    const partialAmount = partialTenants.reduce((sum, t) => {
      const paid = t.payments.filter(p => p.month === currentMonth && p.year === currentYear).reduce((s, p) => s + p.amount, 0)
      return sum + (t.rentAmount - paid)
    }, 0)

    // Occupancy rate
    const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
    const occupiedUnits = activeTenants.length
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    // Last 6 months revenue chart data
    const chartData = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i
      let y = currentYear
      if (m <= 0) { m += 12; y -= 1 }

      const monthActiveTenants = tenants.filter(t => {
        if (t.status !== 'active') return false
        const leaseStart = t.leaseStart ? new Date(t.leaseStart) : null
        const leaseEnd = t.leaseEnd ? new Date(t.leaseEnd) : null
        if (leaseStart && leaseStart > new Date(y, m, 1)) return false
        if (leaseEnd && leaseEnd < new Date(y, m - 1, 1)) return false
        return true
      })

      const monthExpected = monthActiveTenants.reduce((sum, t) => sum + t.rentAmount, 0)
      const monthPayments = tenants.flatMap(t => t.payments).filter(p => p.month === m && p.year === y)
      const monthCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0)

      chartData.push({
        month: monthNames[m - 1],
        expected: monthExpected,
        collected: monthCollected,
      })
    }

    // Due soon (within 5 days of month start — pay by 5th)
    const dayOfMonth = now.getDate()
    const dueSoon = dayOfMonth <= 5 ? overdueTenants : []

    return NextResponse.json({
      company,
      stats: {
        expectedRevenue,
        collectedRevenue,
        overdueCount: overdueTenants.length,
        overdueAmount: overdueAmount + partialAmount,
        activeTenants: activeTenants.length,
        totalTenants: tenants.length,
        occupancyRate,
        totalUnits,
        occupiedUnits,
        partialCount: partialTenants.length,
      },
      overdueTenants,
      partialTenants,
      dueSoon,
      activeTenantsList: activeTenants,
      recentPayments: payments,
      chartData,
      properties,
      expenses,
      maintenanceItems,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
