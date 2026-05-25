'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, getMonthName, getPaymentStatusColor, getWhatsAppLink } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Banknote, MessageCircle, Check, AlertTriangle, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RentCollection() {
  const { language } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payingTenant, setPayingTenant] = useState<TenantData | null>(null)
  const [payForm, setPayForm] = useState({ amount: 0, method: 'cash', reference: '', notes: '' })

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants')
      if (res.ok) setTenants(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const activeTenants = tenants.filter(t => t.status === 'active')

  const getTenantPaymentStatus = (tenant: TenantData): 'paid' | 'partial' | 'overdue' | 'due-soon' => {
    const payments = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid >= tenant.rentAmount) return 'paid'
    if (totalPaid > 0) return 'partial'
    const now = new Date()
    if (selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() && now.getDate() <= 5) return 'due-soon'
    if (selectedMonth < now.getMonth() + 1 || selectedYear < now.getFullYear()) return 'overdue'
    return 'overdue'
  }

  const filteredTenants = activeTenants.filter(t => {
    const status = getTenantPaymentStatus(t)
    if (filter === 'all') return true
    if (filter === 'paid') return status === 'paid'
    if (filter === 'unpaid') return status === 'overdue' || status === 'due-soon' || status === 'partial'
    if (filter === 'overdue') return status === 'overdue'
    return true
  })

  const stats = {
    total: activeTenants.length,
    paid: activeTenants.filter(t => getTenantPaymentStatus(t) === 'paid').length,
    partial: activeTenants.filter(t => getTenantPaymentStatus(t) === 'partial').length,
    overdue: activeTenants.filter(t => getTenantPaymentStatus(t) === 'overdue').length,
    expectedRevenue: activeTenants.reduce((s, t) => s + t.rentAmount, 0),
    collectedRevenue: activeTenants.reduce((s, t) => {
      const paid = (t.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
      return s + paid
    }, 0),
  }

  const openPayDialog = (tenant: TenantData) => {
    setPayingTenant(tenant)
    const paid = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
    setPayForm({ amount: tenant.rentAmount - paid, method: 'cash', reference: '', notes: '' })
    setPayDialogOpen(true)
  }

  const handlePay = async () => {
    if (!payingTenant) return
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: payingTenant.id,
        amount: payForm.amount,
        date: new Date().toISOString(),
        month: selectedMonth,
        year: selectedYear,
        method: payForm.method,
        reference: payForm.reference,
        notes: payForm.notes,
      }),
    })
    setPayDialogOpen(false)
    fetchData()
  }

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const nextMonth = () => {
    const now = new Date()
    if (selectedMonth >= now.getMonth() + 1 && selectedYear >= now.getFullYear()) return
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const sendAllReminders = () => {
    const unpaid = activeTenants.filter(t => {
      const status = getTenantPaymentStatus(t)
      return status === 'overdue' || status === 'partial'
    })
    for (const tenant of unpaid) {
      window.open(getWhatsAppLink(tenant.phone, tenant.name, tenant.rentAmount, selectedMonth, selectedYear, language), '_blank')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('Rent Collection', 'تحصيل الإيجار')}</h1>
        </div>
        <Button onClick={sendAllReminders} variant="outline" className="border-emerald text-emerald hover:bg-emerald/10">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('Remind All Unpaid', 'تذكير الكل')}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {getMonthName(selectedMonth, language)} {selectedYear}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(`${stats.collectedRevenue.toLocaleString()} / ${stats.expectedRevenue.toLocaleString()} AED collected`, `${stats.collectedRevenue.toLocaleString()} / ${stats.expectedRevenue.toLocaleString()} درهم محصّل`)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={selectedMonth >= new Date().getMonth() + 1 && selectedYear >= new Date().getFullYear()}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('Total Tenants', 'إجمالي المستأجرين')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('Paid', 'مدفوع')}</p>
            <p className="text-2xl font-bold text-emerald">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-amber-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('Partial', 'جزئي')}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-red-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('Overdue', 'متأخر')}</p>
            <p className="text-2xl font-bold text-red-600 overdue-pulse">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('Collection Progress', 'تقدم التحصيل')}</span>
            <span className="text-sm font-bold text-emerald">
              {stats.expectedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.expectedRevenue) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-emerald h-3 rounded-full transition-all"
              style={{ width: `${stats.expectedRevenue > 0 ? (stats.collectedRevenue / stats.expectedRevenue) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'paid', 'unpaid', 'overdue'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {f === 'all' && t('All', 'الكل')}
            {f === 'paid' && t('Paid', 'مدفوع')}
            {f === 'unpaid' && t('Unpaid', 'غير مدفوع')}
            {f === 'overdue' && t('Overdue', 'متأخر')}
          </Button>
        ))}
      </div>

      {/* Tenant Payment Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filteredTenants.map(tenant => {
          const status = getTenantPaymentStatus(tenant)
          const paid = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
          const remaining = tenant.rentAmount - paid

          return (
            <Card key={tenant.id} className={cn2('card-hover', status === 'overdue' && 'ring-1 ring-red-300')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {language === 'ar' && tenant.nameAr ? tenant.nameAr : tenant.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tenant.property?.name} • {tenant.unitNumber || '—'}
                    </p>
                  </div>
                  <Badge className={cn2('text-xs', getPaymentStatusColor(status))}>
                    {status === 'paid' && t('PAID', 'مدفوع')}
                    {status === 'partial' && t('PARTIAL', 'جزئي')}
                    {status === 'overdue' && t('OVERDUE', 'متأخر')}
                    {status === 'due-soon' && t('DUE SOON', 'مستحق قريباً')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('Rent', 'الإيجار')}</p>
                    <p className="font-bold text-sm">{formatAED(tenant.rentAmount)}</p>
                  </div>
                  {status !== 'paid' && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('Remaining', 'المتبقي')}</p>
                      <p className="font-bold text-sm text-red-600">{formatAED(remaining)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  {status !== 'paid' && (
                    <Button
                      size="sm"
                      onClick={() => openPayDialog(tenant)}
                      className="flex-1 bg-emerald hover:bg-emerald/90 text-white h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t('Mark Paid', 'تسجيل دفع')}
                    </Button>
                  )}
                  {status !== 'paid' && (
                    <a
                      href={getWhatsAppLink(tenant.phone, tenant.name, remaining, selectedMonth, selectedYear, language)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs border border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('No tenants match the filter', 'لا يوجد مستأجرون مطابقون للفلتر')}
        </div>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('Record Payment', 'تسجيل دفعة')} — {payingTenant && (language === 'ar' && payingTenant.nameAr ? payingTenant.nameAr : payingTenant.name)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Amount (AED)', 'المبلغ (درهم)')}</Label>
              <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('Payment Method', 'طريقة الدفع')}</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('Cash', 'نقدي')}</SelectItem>
                  <SelectItem value="transfer">{t('Bank Transfer', 'تحويل بنكي')}</SelectItem>
                  <SelectItem value="cheque">{t('Cheque', 'شيك')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Reference / Receipt No.', 'المرجع / رقم الإيصال')}</Label>
              <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>{t('Notes', 'ملاحظات')}</Label>
              <Input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handlePay} className="bg-emerald hover:bg-emerald/90 text-white" disabled={payForm.amount <= 0}>
              <Check className="w-4 h-4 mr-2" />
              {t('Confirm Payment', 'تأكيد الدفع')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn2(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
