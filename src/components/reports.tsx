'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ReportData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, getMonthName, getCategoryIcon } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
} from 'recharts'

const PIE_COLORS = ['#0D7C3D', '#C5A028', '#0A5C4E', '#C4653A', '#8b5cf6']

export default function Reports() {
  const { language } = useAppStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) setData(await res.json())
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

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t('No data', 'لا بيانات')}</div>
  }

  const expensePieData = Object.entries(data.expenseBreakdown).map(([key, value]) => ({
    name: t(key.charAt(0).toUpperCase() + key.slice(1), key === 'utility' ? 'مرافق' : key === 'maintenance' ? 'صيانة' : key === 'insurance' ? 'تأمين' : key === 'salary' ? 'رواتب' : 'أخرى'),
    value,
  }))

  const trendChartData = data.trend.map(item => ({
    month: getMonthName(item.month, language),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">{t('Reports', 'التقارير')}</h1>
        </div>
        <Button onClick={handlePrint} variant="outline" className="border-emerald text-emerald">
          <Download className="w-4 h-4 mr-2" />
          {t('Print Report', 'طباعة التقرير')}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {getMonthName(selectedMonth, language)} {selectedYear}
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
              <p className="text-xs text-muted-foreground">{t('Revenue', 'الإيرادات')}</p>
            </div>
            <p className="text-xl font-bold text-emerald">{formatAED(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`of ${formatAED(data.expectedRevenue)} expected`, `من ${formatAED(data.expectedRevenue)} متوقع`)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-terracotta" />
              <p className="text-xs text-muted-foreground">{t('Expenses', 'المصروفات')}</p>
            </div>
            <p className="text-xl font-bold text-terracotta">{formatAED(data.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`card-hover border-l-4 ${data.profitLoss >= 0 ? 'border-l-emerald' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-500'}`} />
              <p className="text-xs text-muted-foreground">{t('Profit / Loss', 'الربح / الخسارة')}</p>
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
              <p className="text-xs text-muted-foreground">{t('Collection Rate', 'نسبة التحصيل')}</p>
            </div>
            <p className="text-xl font-bold text-deep-teal">{data.collectionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`${data.occupiedUnits}/${data.totalUnits} occupied`, `${data.occupiedUnits}/${data.totalUnits} مشغول`)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('6-Month Trend', 'اتجاه 6 أشهر')}</CardTitle>
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
                  <Bar dataKey="revenue" name={t('Revenue', 'الإيرادات')} fill="#0D7C3D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('Expenses', 'المصروفات')} fill="#C4653A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('Expense Breakdown', 'توزيع المصروفات')}</CardTitle>
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
                {t('No expenses this month', 'لا مصروفات هذا الشهر')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('Expense Details', 'تفاصيل المصروفات')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.monthlyExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(e.category)}</span>
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {t(e.category.charAt(0).toUpperCase() + e.category.slice(1), e.category)}
                    </Badge>
                  </div>
                </div>
                <span className="font-semibold text-terracotta">{formatAED(e.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
