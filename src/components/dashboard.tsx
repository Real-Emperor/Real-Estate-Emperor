'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DashboardData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, getMonthName, getPaymentStatusColor, getWhatsAppLink } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Banknote,
  AlertTriangle,
  Users,
  Home,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MessageCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function Dashboard() {
  const { language } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات' : 'No data found'}
        </p>
        <Button
          onClick={async () => {
            await fetch('/api/seed', { method: 'POST' })
            fetchData()
          }}
          className="bg-emerald hover:bg-emerald/90"
        >
          {language === 'ar' ? 'تحميل البيانات التجريبية' : 'Load Sample Data'}
        </Button>
      </div>
    )
  }

  const s = data.stats
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  return (
    <div className="space-y-6 stagger-children">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('Dashboard', 'لوحة التحكم')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t(
            `${getMonthName(currentMonth)} ${currentYear} Overview`,
            `نظرة عامة على ${getMonthName(currentMonth, 'ar')} ${currentYear}`
          )}
        </p>
      </div>

      {/* Overdue Alert Banner */}
      {s.overdueCount > 0 && (
        <div className="overdue-pulse bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg">
              {t(
                `${s.overdueCount} TENANT${s.overdueCount > 1 ? 'S' : ''} OVERDUE`,
                `${s.overdueCount} مستأجر متأخر`
              )}
            </p>
            <p className="text-red-100 text-sm">
              {t(
                `${formatAED(s.overdueAmount)} UNCOLLECTED`,
                `${formatAED(s.overdueAmount)} غير محصّل`
              )}
            </p>
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              useAppStore.getState().setCurrentPage('rent')
            }}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {t('View Details', 'عرض التفاصيل')}
          </a>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Banknote className="w-5 h-5 text-emerald" />
              <Badge variant="secondary" className="text-xs">
                {t('Monthly', 'شهري')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Collected Revenue', 'الإيرادات المحصّلة')}
            </p>
            <p className="text-xl font-bold text-emerald mt-1">
              {formatAED(s.collectedRevenue)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald" />
              <span className="text-xs text-muted-foreground">
                {t(`of ${formatAED(s.expectedRevenue)} expected`, `من ${formatAED(s.expectedRevenue)} متوقع`)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn2('card-hover', s.overdueCount > 0 && 'border-l-4 border-l-red-500')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={cn2('w-5 h-5', s.overdueCount > 0 ? 'text-red-500' : 'text-gray-400')} />
              {s.overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 overdue-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Overdue', 'متأخر')}
            </p>
            <p className={cn2('text-xl font-bold mt-1', s.overdueCount > 0 ? 'text-red-600' : 'text-gray-600')}>
              {s.overdueCount}
            </p>
            {s.overdueCount > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {formatAED(s.overdueAmount)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-gold" />
              <Badge variant="secondary" className="text-xs">
                {t('Active', 'نشط')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Active Tenants', 'المستأجرون النشطون')}
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {s.activeTenants}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`${s.totalTenants} total`, `${s.totalTenants} إجمالي`)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Home className="w-5 h-5 text-deep-teal" />
              <Badge variant="secondary" className="text-xs">
                {s.occupancyRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Occupancy Rate', 'نسبة الإشغال')}
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {s.occupiedUnits}/{s.totalUnits}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-deep-teal h-1.5 rounded-full transition-all"
                style={{ width: `${s.occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Board */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {t('Payment Status Board', 'لوحة حالة الدفع')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.activeTenantsList.map((tenant: any) => {
              const payments = tenant.payments || []
              const monthPayments = payments.filter((p: any) => p.month === currentMonth && p.year === currentYear)
              const totalPaid = monthPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

              let status: 'paid' | 'overdue' | 'partial' | 'inactive' | 'due-soon'
              if (tenant.status !== 'active') {
                status = 'inactive'
              } else if (totalPaid >= tenant.rentAmount) {
                status = 'paid'
              } else if (totalPaid > 0) {
                status = 'partial'
              } else {
                status = 'overdue'
              }

              return (
                <div
                  key={tenant.id}
                  className={cn2(
                    'rounded-lg p-3 text-center card-hover cursor-pointer',
                    getPaymentStatusColor(status)
                  )}
                >
                  <p className="font-semibold text-sm truncate">
                    {language === 'ar' && tenant.nameAr ? tenant.nameAr : tenant.name}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {tenant.unitNumber || '—'}
                  </p>
                  <p className="text-xs font-bold mt-1">
                    {status === 'paid' && t('PAID', 'مدفوع')}
                    {status === 'overdue' && t('OVERDUE', 'متأخر')}
                    {status === 'partial' && t('PARTIAL', 'جزئي')}
                    {status === 'inactive' && t('INACTIVE', 'غير نشط')}
                  </p>
                  {status === 'overdue' && (
                    <a
                      href={getWhatsAppLink(tenant.phone, tenant.name, tenant.rentAmount, currentMonth, currentYear, language)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs bg-white/20 rounded px-1.5 py-0.5 hover:bg-white/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3 h-3" />
                      {t('Remind', 'تذكير')}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {t('Revenue Trend (6 Months)', 'اتجاه الإيرادات (6 أشهر)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatAED(value)}
                    contentStyle={{
                      backgroundColor: '#FFF8E7',
                      border: '1px solid #e5e0d5',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="expected" name={t('Expected', 'متوقع')} fill="#0A5C4E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name={t('Collected', 'محصّل')} fill="#C5A028" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {t('Recent Payments', 'المدفوعات الأخيرة')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {data.recentPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-emerald" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {language === 'ar' && payment.tenant?.nameAr ? payment.tenant.nameAr : payment.tenant?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method || '—'} • {payment.reference || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald">
                      {formatAED(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getMonthName(payment.month, language)} {payment.year}
                    </p>
                  </div>
                </div>
              ))}
              {data.recentPayments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('No recent payments', 'لا توجد مدفوعات حديثة')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn2(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
