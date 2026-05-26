'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ReportData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, getCategoryIcon } from '@/lib/utils'
import { t, getMonthName, getExpenseCategoryLabel, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  BarChart3,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

const PIE_COLORS = ['#0D7C3D', '#C5A028', '#0A5C4E', '#C4653A', '#8b5cf6', '#ef4444', '#06b6d4']

export default function Reports() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Access control: Owner/Admin only
  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const fetchData = useCallback(() => {
    try {
      const reportData = useDataStore.getState().getReportData(selectedMonth, selectedYear)
      if (reportData) setData(reportData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ShieldAlert className="w-12 h-12 text-terracotta" />
        <h2 className="text-xl font-bold">{t('accessDenied', lang)}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', lang)}</p>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t('noData', lang)}</div>
  }

  const expensePieData = Object.entries(data.expenseBreakdown).map(([key, value]) => ({
    name: getExpenseCategoryLabel(key, lang),
    value,
  }))

  const trendChartData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }))

  // Revenue analysis monthly trend data
  const revenueTrendData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expected: data.expectedRevenue,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">{t('reports', lang)}</h1>
        </div>
        <Button onClick={handlePrint} variant="outline" className="border-emerald text-emerald">
          <Download className="w-4 h-4 mr-2" />
          {t('printReport', lang)}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {getMonthName(selectedMonth, lang)} {selectedYear}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <p className="text-xs text-muted-foreground">{t('revenue', lang)}</p>
            </div>
            <p className="text-xl font-bold text-emerald">{formatAED(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ofExpected', lang)} {formatAED(data.expectedRevenue)} {t('expected', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-terracotta" />
              <p className="text-xs text-muted-foreground">{t('expenses', lang)}</p>
            </div>
            <p className="text-xl font-bold text-terracotta">{formatAED(data.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`card-hover border-l-4 ${data.profitLoss >= 0 ? 'border-l-emerald' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-500'}`} />
              <p className="text-xs text-muted-foreground">{t('profitOrLoss', lang)}</p>
            </div>
            <p className={`text-xl font-bold ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-600'}`}>
              {formatAED(data.profitLoss)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-deep-teal" />
              <p className="text-xs text-muted-foreground">{t('collectionRate', lang)}</p>
            </div>
            <p className="text-xl font-bold text-deep-teal">{data.collectionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.occupiedUnits}/{data.totalUnits} {t('occupiedUnits', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('sixMonthTrend', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatAED(value)}
                    contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name={t('revenue', lang)} fill="#0D7C3D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('expenses', lang)} fill="#C4653A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('expenseBreakdown', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAED(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald" />
            {t('revenueAnalysis', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend Line Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('monthlyTrend', lang)}</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatAED(value)}
                      contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name={t('revenue', lang)} stroke="#0D7C3D" fill="#0D7C3D" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('totalRevenue', lang)}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald" />
                    <span className="text-sm">{t('rentalIncome', lang)}</span>
                  </div>
                  <span className="font-semibold text-emerald">{formatAED(data.rentalIncome)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t('otherIncome', lang)}</span>
                  </div>
                  <span className="font-semibold">{formatAED(data.otherIncome)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between p-3 rounded-lg bg-emerald/10">
                  <span className="text-sm font-semibold">{t('grossRevenue', lang)}</span>
                  <span className="font-bold text-emerald">{formatAED(data.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('vacancyLoss', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.vacancyLoss)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('badDebt', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.badDebt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald" />
            {t('profitAndLoss', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-emerald/5">
              <span className="text-sm font-medium">{t('rentalIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-emerald text-right">{formatAED(data.rentalIncome)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-muted/30">
              <span className="text-sm">{t('otherIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-right">{formatAED(data.otherIncome)}</span>
            </div>

            {/* Gross Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-emerald/30 bg-emerald/5">
              <span className="text-sm font-bold">{t('grossRevenue', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-bold text-emerald text-right">{formatAED(data.grossRevenue)}</span>
            </div>

            {/* Deductions */}
            <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3">
              {t('costOfOperations', lang)}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('vacancyLoss', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.vacancyLoss)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('badDebt', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.badDebt)}</span>
            </div>

            {/* Gross Profit */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-amber-300 bg-amber-50">
              <span className="text-sm font-bold">{t('grossProfit', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className={`font-bold text-right ${data.grossProfit >= 0 ? 'text-emerald' : 'text-red-600'}`}>{formatAED(data.grossProfit)}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('operatingExpenses', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.costOfOperations)}</span>
            </div>

            {/* Net Income */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-4 rounded-lg border-2 border-emerald bg-emerald/10">
              <span className="text-base font-bold">{t('netIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <div className="flex items-center gap-2">
                {data.netIncome >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald" />
                ) : data.netIncome < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                ) : (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-lg font-bold text-right ${data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}`}>
                  {formatAED(data.netIncome)}
                </span>
              </div>
            </div>

            {/* Margin indicator */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              <span>{t('collectionRate', lang)}: <strong className="text-foreground">{data.collectionRate}%</strong></span>
              <span>|</span>
              <span>{t('occupancyRate', lang)}: <strong className="text-foreground">{data.occupancyRate}%</strong></span>
              <span>|</span>
              <span>{t('netProfit', lang)}: <strong className={data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}>
                {data.grossRevenue > 0 ? ((data.netIncome / data.grossRevenue) * 100).toFixed(1) : 0}%
              </strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('expenseDetails', lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.monthlyExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(e.category)}</span>
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getExpenseCategoryLabel(e.category, lang)}
                      </Badge>
                      {e.vendor && <span className="text-xs text-muted-foreground">{e.vendor}</span>}
                      {e.recurring && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t('recurring', lang)}</Badge>}
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-terracotta">{formatAED(e.amount)}</span>
              </div>
            ))}
            {data.monthlyExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
