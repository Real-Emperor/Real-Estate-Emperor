'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, getPaymentStatusColor, cn2 } from '@/lib/utils'
import { t, getMonthName, getNameByLang, getWhatsAppLink, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Banknote, MessageCircle, Check, AlertTriangle, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RentCollection() {
  const { language, authUser } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payingTenant, setPayingTenant] = useState<TenantData | null>(null)
  const [payForm, setPayForm] = useState({ amount: 0, method: 'cash', reference: '', notes: '' })

  const canSeeRevenue = isOwnerOrAdmin(authUser?.role || '')

  const fetchData = useCallback(() => {
    try {
      const tenants = useDataStore.getState().getTenantsWithRelations()
      setTenants(tenants)
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

  const handlePay = () => {
    if (!payingTenant) return
    useDataStore.getState().addPayment({
      tenantId: payingTenant.id,
      amount: payForm.amount,
      date: new Date().toISOString(),
      month: selectedMonth,
      year: selectedYear,
      method: payForm.method,
      reference: payForm.reference || null,
      receiptNumber: null,
      notes: payForm.notes || null,
      isLate: false,
      daysLate: 0,
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
      const phone = tenant.whatsapp || tenant.phone
      window.open(getWhatsAppLink(phone, getNameByLang(tenant, language), tenant.rentAmount, selectedMonth, selectedYear, language), '_blank')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('rentCollection', language)}</h1>
        </div>
        <Button onClick={sendAllReminders} variant="outline" className="border-emerald text-emerald hover:bg-emerald/10">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('remindAllUnpaid', language)}
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
          {canSeeRevenue && (
            <p className="text-sm text-muted-foreground">
              {stats.collectedRevenue.toLocaleString()} / {stats.expectedRevenue.toLocaleString()} AED {t('collected', language)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={selectedMonth >= new Date().getMonth() + 1 && selectedYear >= new Date().getFullYear()}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('activeTenants', language)}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('paid', language)}</p>
            <p className="text-2xl font-bold text-emerald">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-amber-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('partial', language)}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-red-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('overdue', language)}</p>
            <p className="text-2xl font-bold text-red-600 overdue-pulse">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection progress */}
      {canSeeRevenue && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('collectionProgress', language)}</span>
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
      )}

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
            {f === 'all' && t('all', language)}
            {f === 'paid' && t('paid', language)}
            {f === 'unpaid' && t('unpaid', language)}
            {f === 'overdue' && t('overdue', language)}
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
                      {getNameByLang(tenant, language)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tenant.property ? getNameByLang(tenant.property, language) : ''} • {tenant.unitNumber || '—'}
                    </p>
                  </div>
                  <Badge className={cn2('text-xs', getPaymentStatusColor(status))}>
                    {status === 'paid' && t('paid', language)}
                    {status === 'partial' && t('partial', language)}
                    {status === 'overdue' && t('overdue', language)}
                    {status === 'due-soon' && t('dueSoon', language)}
                  </Badge>
                </div>

                {canSeeRevenue && (
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('rent', language)}</p>
                      <p className="font-bold text-sm">{formatAED(tenant.rentAmount)}</p>
                    </div>
                    {status !== 'paid' && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('remaining', language)}</p>
                        <p className="font-bold text-sm text-red-600">{formatAED(remaining)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {status !== 'paid' && (
                    <Button
                      size="sm"
                      onClick={() => openPayDialog(tenant)}
                      className="flex-1 bg-emerald hover:bg-emerald/90 text-white h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t('markPaid', language)}
                    </Button>
                  )}
                  {status !== 'paid' && (
                    <a
                      href={getWhatsAppLink(tenant.whatsapp || tenant.phone, getNameByLang(tenant, language), remaining, selectedMonth, selectedYear, language)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs border border-green-300 text-green-700 hover:bg-green-50"
                      title={t('sendWhatsAppReminder', language)}
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
          {t('noTenantsMatchFilter', language)}
        </div>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('recordPayment', language)} — {payingTenant && getNameByLang(payingTenant, language)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('amount', language)}</Label>
              <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('paymentMethod', language)}</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('cash', language)}</SelectItem>
                  <SelectItem value="transfer">{t('bankTransfer', language)}</SelectItem>
                  <SelectItem value="cheque">{t('cheque', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('reference', language)}</Label>
              <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>{t('notes', language)}</Label>
              <Input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button onClick={handlePay} className="bg-emerald hover:bg-emerald/90 text-white" disabled={payForm.amount <= 0}>
              <Check className="w-4 h-4 mr-2" />
              {t('confirmPayment', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
