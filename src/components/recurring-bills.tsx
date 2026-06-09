'use client'

import { useEffect, useState, useCallback } from 'react'
import type { RecurringBillData, BillCycleData, RecurringBillPaymentData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, cn2 } from '@/lib/utils'
import { t, getNameByLang, rtlLanguages, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Zap, Plus, Pencil, Trash2, Loader2, Download, Eye, Banknote, FileSpreadsheet, FileText, AlertTriangle, CheckCircle2, Clock, XCircle, RotateCcw, History, ChevronDown, ChevronRight, CreditCard, Receipt } from 'lucide-react'

const SERVICE_TYPES = ['electricity', 'water', 'gas', 'internet', 'cooling', 'chiller', 'parking', 'waste', 'other'] as const
const BILLING_FREQUENCIES = ['monthly', 'quarterly', 'annually'] as const
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'online'] as const
const STATUS_TABS = ['all', 'active', 'paid', 'partially_paid', 'overdue', 'all_payments'] as const

function getServiceTypeLabel(type: string, lang: Language): string {
  const labels: Record<string, Record<Language, string>> = {
    electricity: { en: 'Electricity', ar: 'كهرباء', bn: 'বিদ্যুৎ', ur: 'بجلی' },
    water: { en: 'Water', ar: 'مياه', bn: 'পানি', ur: 'پانی' },
    gas: { en: 'Gas', ar: 'غاز', bn: 'গ্যাস', ur: 'گیس' },
    internet: { en: 'Internet', ar: 'إنترنت', bn: 'ইন্টারনেট', ur: 'انٹرنیٹ' },
    cooling: { en: 'Cooling', ar: 'تبريد', bn: 'কুলিং', ur: 'کولنگ' },
    chiller: { en: 'Chiller', ar: 'مبرد', bn: 'চিলার', ur: 'چلر' },
    parking: { en: 'Parking', ar: 'مواقف', bn: 'পার্কিং', ur: 'پارکنگ' },
    waste: { en: 'Waste', ar: 'نفايات', bn: 'বর্জ্য', ur: 'کچرا' },
    other: { en: 'Other', ar: 'أخرى', bn: 'অন্যান্য', ur: 'دیگر' },
  }
  return labels[type]?.[lang] || type
}

function getPaymentMethodLabel(method: string, lang: Language): string {
  const labels: Record<string, Record<Language, string>> = {
    bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي', bn: 'ব্যাংক ট্রান্সফার', ur: 'بینک ٹرانسفر' },
    cash: { en: 'Cash', ar: 'نقدي', bn: 'নগদ', ur: 'نقد' },
    cheque: { en: 'Cheque', ar: 'شيك', bn: 'চেক', ur: 'چیک' },
    online: { en: 'Online', ar: 'عبر الإنترنت', bn: 'অনলাইন', ur: 'آن لائن' },
  }
  return labels[method]?.[lang] || method
}

function getStatusBadge(status: string, lang: Language) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-500 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{t('paid', lang)}</Badge>
    case 'overdue':
      return <Badge className="bg-red-500 text-white text-xs"><AlertTriangle className="w-3 h-3 mr-1" />{t('overdue', lang)}</Badge>
    case 'partially_paid':
      return <Badge className="bg-amber-500 text-white text-xs"><Clock className="w-3 h-3 mr-1" />{t('partiallyPaid', lang)}</Badge>
    case 'active':
      return <Badge className="bg-blue-500 text-white text-xs"><Zap className="w-3 h-3 mr-1" />{t('active', lang)}</Badge>
    case 'cancelled':
      return <Badge className="bg-gray-400 text-white text-xs"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
    case 'pending':
      return <Badge className="bg-slate-400 text-white text-xs"><Clock className="w-3 h-3 mr-1" />{t('pending', lang)}</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function getTabLabel(tab: string, lang: Language): string {
  switch (tab) {
    case 'all': return t('all', lang)
    case 'active': return t('active', lang)
    case 'paid': return t('paid', lang)
    case 'partially_paid': return t('partiallyPaid', lang)
    case 'overdue': return t('overdue', lang)
    case 'all_payments': return t('allPayments', lang)
    default: return tab
  }
}

// Extended bill type with effective status from cycle
interface BillWithCycle extends RecurringBillData {
  effectiveStatus: string
  latestCycle: BillCycleData | null
}

export default function RecurringBills() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const isRtl = rtlLanguages.includes(lang)

  const [bills, setBills] = useState<BillWithCycle[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [advanceCycleDialogOpen, setAdvanceCycleDialogOpen] = useState(false)
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false)
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringBillData | null>(null)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [advanceCycleBill, setAdvanceCycleBill] = useState<BillWithCycle | null>(null)
  const [advanceCycleAmount, setAdvanceCycleAmount] = useState(0)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [deletingPayment, setDeletingPayment] = useState<any>(null)
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set())
  const [payingBill, setPayingBill] = useState<BillWithCycle | null>(null)

  const [form, setForm] = useState({
    propertyId: '',
    providerName: '',
    serviceType: 'electricity',
    accountNumber: '',
    customerNumber: '',
    contractNumber: '',
    monthlyExpectedAmount: 0,
    currentOutstandingBalance: 0,
    nextDueDate: '',
    billingFrequency: 'monthly',
    autoRenew: false,
    gracePeriodDays: 0,
    internalNotes: '',
  })

  const [payForm, setPayForm] = useState({
    recurringBillId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference: '',
    notes: '',
  })

  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: 0,
    paymentDate: '',
    method: 'bank_transfer',
    reference: '',
    notes: '',
  })

  const canModify = authUser && isOwnerOrAdmin(authUser.role)
  const isStaff = authUser?.role === 'staff'

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const store = useDataStore.getState()
      setProperties(store.getPropertiesWithTenants())

      const params = new URLSearchParams()
      params.set('limit', '1000')
      if (statusFilter !== 'all' && statusFilter !== 'all_payments') params.set('status', statusFilter)
      if (propertyFilter !== 'all') params.set('propertyId', propertyFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/recurring-bills?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const billList = data.data || data || []
        setBills(Array.isArray(billList) ? billList : [])
      } else {
        // Fallback to store data with cycle derivation
        const storeBills = store.recurringBills.map(b => ({
          ...b,
          effectiveStatus: b.status,
          latestCycle: (b.cycles && b.cycles.length > 0) ? b.cycles[0] : null,
        }))
        setBills(storeBills)
      }
    } catch (e) {
      console.error(e)
      try {
        const store = useDataStore.getState()
        const storeBills = store.recurringBills.map(b => ({
          ...b,
          effectiveStatus: b.status,
          latestCycle: (b.cycles && b.cycles.length > 0) ? b.cycles[0] : null,
        }))
        setBills(storeBills)
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [statusFilter, propertyFilter, search])

  useEffect(() => { fetchBills() }, [fetchBills])

  // Build flat list of all payments across all bills for the "all_payments" tab
  const allPayments = useCallback(() => {
    const payments: any[] = []
    for (const bill of bills) {
      const billPayments = bill.payments || []
      for (const p of billPayments) {
        const cycle = bill.cycles?.find((c: any) => c.id === p.billCycleId)
        payments.push({
          ...p,
          providerName: bill.providerName,
          serviceType: bill.serviceType,
          propertyId: bill.propertyId,
          propertyName: bill.property?.name || properties.find(pr => pr.id === bill.propertyId)?.name || '—',
          cyclePeriodStart: cycle?.periodStart || null,
          cyclePeriodEnd: cycle?.periodEnd || null,
          cycleNumber: cycle?.cycleNumber || null,
        })
      }
    }
    return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [bills, properties])

  // Summary calculations — derived from cycle data
  const totalBills = bills.length
  const outstandingBalance = bills.reduce((s, b) => {
    if (b.latestCycle) return s + Number(b.latestCycle.outstandingAmount || 0)
    return s + Number(b.currentOutstandingBalance || 0)
  }, 0)
  const paidThisMonth = bills.filter(b => b.effectiveStatus === 'paid').reduce((s, b) => {
    if (b.latestCycle) return s + Number(b.latestCycle.paidAmount || 0)
    return s
  }, 0)
  const overdueCount = bills.filter(b => b.effectiveStatus === 'overdue').length

  const openNew = () => {
    setEditing(null)
    setForm({
      propertyId: properties[0]?.id || '',
      providerName: '',
      serviceType: 'electricity',
      accountNumber: '',
      customerNumber: '',
      contractNumber: '',
      monthlyExpectedAmount: 0,
      currentOutstandingBalance: 0,
      nextDueDate: '',
      billingFrequency: 'monthly',
      autoRenew: false,
      gracePeriodDays: 0,
      internalNotes: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (bill: BillWithCycle) => {
    setEditing(bill)
    setForm({
      propertyId: bill.propertyId,
      providerName: bill.providerName,
      serviceType: bill.serviceType,
      accountNumber: bill.accountNumber || '',
      customerNumber: bill.customerNumber || '',
      contractNumber: bill.contractNumber || '',
      monthlyExpectedAmount: Number(bill.monthlyExpectedAmount),
      currentOutstandingBalance: Number(bill.currentOutstandingBalance),
      nextDueDate: bill.nextDueDate ? new Date(bill.nextDueDate).toISOString().split('T')[0] : '',
      billingFrequency: bill.billingFrequency,
      autoRenew: bill.autoRenew,
      gracePeriodDays: bill.gracePeriodDays,
      internalNotes: bill.internalNotes || '',
    })
    setDialogOpen(true)
  }

  const openPay = (bill: BillWithCycle) => {
    setPayingBill(bill)
    const cycleOutstanding = bill.latestCycle ? Number(bill.latestCycle.outstandingAmount) : Number(bill.currentOutstandingBalance || bill.monthlyExpectedAmount)
    setPayForm({
      recurringBillId: bill.id,
      amount: cycleOutstanding,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: '',
    })
    setPayDialogOpen(true)
  }

  const openDetail = async (bill: BillWithCycle) => {
    try {
      const res = await fetch(`/api/recurring-bills/${bill.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBill(data.data || data)
      } else {
        setSelectedBill(bill)
      }
    } catch {
      setSelectedBill(bill)
    }
    setDetailDialogOpen(true)
  }

  const handleSave = async () => {
    const store = useDataStore.getState()
    const body = {
      ...form,
      monthlyExpectedAmount: Number(form.monthlyExpectedAmount),
      currentOutstandingBalance: Number(form.currentOutstandingBalance),
      nextDueDate: form.nextDueDate || null,
      accountNumber: form.accountNumber || null,
      customerNumber: form.customerNumber || null,
      contractNumber: form.contractNumber || null,
      internalNotes: form.internalNotes || null,
    }
    try {
      if (editing) {
        await store.updateRecurringBill(editing.id, body)
      } else {
        await store.addRecurringBill(body)
      }
      setDialogOpen(false)
      fetchBills()
    } catch (error) {
      console.error('Failed to save bill:', error)
    }
  }

  const handlePay = async () => {
    const store = useDataStore.getState()
    try {
      await store.payRecurringBill({
        recurringBillId: payForm.recurringBillId,
        amount: Number(payForm.amount),
        paymentDate: payForm.paymentDate,
        method: payForm.method,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      })
      setPayDialogOpen(false)
      fetchBills()
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteBill', lang))) return
    try {
      await useDataStore.getState().deleteRecurringBill(id)
      fetchBills()
    } catch (error) {
      console.error('Failed to delete bill:', error)
    }
  }

  const handleExport = async (format: string) => {
    try {
      const res = await fetch(`/api/recurring-bills/export?format=${format}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recurring-bills-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const openAdvanceCycle = (bill: BillWithCycle) => {
    setAdvanceCycleBill(bill)
    setAdvanceCycleAmount(Number(bill.monthlyExpectedAmount))
    setAdvanceCycleDialogOpen(true)
  }

  const handleAdvanceCycle = async () => {
    if (!advanceCycleBill) return
    try {
      const res = await fetch(`/api/recurring-bills/${advanceCycleBill.id}/advance-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: advanceCycleAmount }),
      })
      if (res.ok) {
        setAdvanceCycleDialogOpen(false)
        fetchBills()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to advance cycle')
      }
    } catch (error) {
      console.error('Advance cycle failed:', error)
    }
  }

  const openEditPayment = (payment: any) => {
    setEditingPayment(payment)
    setEditPaymentForm({
      amount: Number(payment.amount),
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      method: payment.method || 'bank_transfer',
      reference: payment.reference || '',
      notes: payment.notes || '',
    })
    setEditPaymentDialogOpen(true)
  }

  const handleEditPayment = async () => {
    if (!editingPayment) return
    const store = useDataStore.getState()
    try {
      await store.editBillPayment(editingPayment.id, {
        amount: Number(editPaymentForm.amount),
        paymentDate: editPaymentForm.paymentDate,
        method: editPaymentForm.method,
        reference: editPaymentForm.reference || null,
        notes: editPaymentForm.notes || null,
      })
      setEditPaymentDialogOpen(false)
      setEditingPayment(null)
      // Refresh detail if open
      if (selectedBill) {
        try {
          const res = await fetch(`/api/recurring-bills/${selectedBill.id}`)
          if (res.ok) {
            const data = await res.json()
            setSelectedBill(data.data || data)
          }
        } catch {}
      }
      fetchBills()
    } catch (error) {
      console.error('Failed to edit payment:', error)
    }
  }

  const openDeletePayment = (payment: any) => {
    setDeletingPayment(payment)
    setDeletePaymentDialogOpen(true)
  }

  const handleDeletePayment = async () => {
    if (!deletingPayment) return
    const store = useDataStore.getState()
    try {
      await store.deleteBillPayment(deletingPayment.id)
      setDeletePaymentDialogOpen(false)
      setDeletingPayment(null)
      // Refresh detail if open
      if (selectedBill) {
        try {
          const res = await fetch(`/api/recurring-bills/${selectedBill.id}`)
          if (res.ok) {
            const data = await res.json()
            setSelectedBill(data.data || data)
          }
        } catch {}
      }
      fetchBills()
    } catch (error) {
      console.error('Failed to delete payment:', error)
    }
  }

  const toggleCycleExpand = (cycleId: string) => {
    setExpandedCycles(prev => {
      const next = new Set(prev)
      if (next.has(cycleId)) next.delete(cycleId)
      else next.add(cycleId)
      return next
    })
  }

  // Mask financial amounts for staff
  const maskedAmount = (amount: number) => isStaff ? '—' : formatAED(amount)

  if (loading && bills.length === 0) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  const isAllPaymentsTab = statusFilter === 'all_payments'
  const flatPayments = allPayments()

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            {t('recurringBills', lang)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalBills} {t('totalBills', lang).toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} className="text-xs">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="text-xs">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          {canModify && (
            <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('addBill', lang)}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder={t('searchBills', lang)}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-4"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('totalBills', lang)}</p>
            <p className="text-2xl font-bold">{totalBills}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('outstandingBalance', lang)}</p>
            <p className="text-2xl font-bold text-terracotta">{maskedAmount(outstandingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('paidThisMonth', lang)}</p>
            <p className="text-2xl font-bold text-emerald-600">{maskedAmount(paidThisMonth)}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('overdueCount', lang)}</p>
            <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab}
            variant={statusFilter === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab)}
            className={statusFilter === tab ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {tab === 'all_payments' && <Receipt className="w-3.5 h-3.5 mr-1" />}
            {getTabLabel(tab, lang)}
          </Button>
        ))}

        <div className="ml-auto">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder={t('selectProperty', lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all', lang)} {t('properties', lang)}</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All Payments Tab */}
      {isAllPaymentsTab ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('paymentDate' in {} ? 'noData' : 'noData', lang) || 'Date'}</TableHead>
                    <TableHead>{t('providerName', lang)}</TableHead>
                    <TableHead>{t('serviceType', lang)}</TableHead>
                    <TableHead>{t('cyclePeriod', lang)}</TableHead>
                    <TableHead>{t('amount', lang)}</TableHead>
                    <TableHead>{t('paymentMethod', lang)}</TableHead>
                    <TableHead>{t('referenceNumber', lang)}</TableHead>
                    <TableHead>{t('outstanding', lang)}</TableHead>
                    {canModify && <TableHead className="text-right">{t('status', lang)}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                      <TableCell className="text-sm font-medium">{p.providerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getServiceTypeLabel(p.serviceType, lang)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.cycleNumber ? `#${p.cycleNumber}` : '—'}
                        {p.cyclePeriodStart ? ` (${formatDate(p.cyclePeriodStart)} — ${formatDate(p.cyclePeriodEnd)})` : ''}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{maskedAmount(Number(p.amount))}</TableCell>
                      <TableCell className="text-sm">{p.method ? getPaymentMethodLabel(p.method, lang) : '—'}</TableCell>
                      <TableCell className="text-sm">{p.reference || '—'}</TableCell>
                      <TableCell className="text-sm text-terracotta">{maskedAmount(Number(p.outstandingAfterPayment))}</TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditPayment(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title={t('editPayment', lang)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openDeletePayment(p)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500" title={t('deletePayment', lang)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {flatPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noPaymentsYet', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Bill List View — Cycle-Centric */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('providerName', lang)}</TableHead>
                    <TableHead>{t('serviceType', lang)}</TableHead>
                    <TableHead>{t('properties', lang)}</TableHead>
                    <TableHead>{t('amountDue', lang)}</TableHead>
                    <TableHead>{t('cyclePaid', lang)}</TableHead>
                    <TableHead>{t('cycleOutstanding', lang)}</TableHead>
                    <TableHead>{t('cycleStatus', lang)}</TableHead>
                    <TableHead className="text-right">{t('status', lang)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map(bill => {
                    const cycle = bill.latestCycle
                    const cycleAmount = cycle ? Number(cycle.amount) : Number(bill.monthlyExpectedAmount)
                    const cyclePaid = cycle ? Number(cycle.paidAmount) : 0
                    const cycleOutstanding = cycle ? Number(cycle.outstandingAmount) : Number(bill.currentOutstandingBalance)

                    return (
                      <TableRow key={bill.id}>
                        <TableCell className="text-sm font-medium">{bill.providerName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getServiceTypeLabel(bill.serviceType, lang)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {bill.property?.name || properties.find(p => p.id === bill.propertyId)?.name || '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{maskedAmount(cycleAmount)}</TableCell>
                        <TableCell className="text-sm text-emerald-600">{maskedAmount(cyclePaid)}</TableCell>
                        <TableCell className="text-sm text-terracotta font-medium">{maskedAmount(cycleOutstanding)}</TableCell>
                        <TableCell>{getStatusBadge(bill.effectiveStatus, lang)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openDetail(bill)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title={t('viewDetails', lang)}>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canModify && (
                              <>
                                <button onClick={() => openAdvanceCycle(bill)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title={t('advanceCycle', lang)}>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openPay(bill)} className="p-1.5 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600" title={t('recordPayment', lang)}>
                                  <Banknote className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openEdit(bill)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title={t('editBill', lang)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(bill.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500" title={t('deleteBill', lang)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {bills.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noData', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Bill Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editBill', lang) : t('addBill', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('selectProperty', lang)}</Label>
              <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder={t('selectProperty', lang)} /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('providerName', lang)}</Label>
                <Input value={form.providerName} onChange={e => setForm({ ...form, providerName: e.target.value })} placeholder="e.g. DEWA" />
              </div>
              <div>
                <Label>{t('serviceType', lang)}</Label>
                <Select value={form.serviceType} onValueChange={v => setForm({ ...form, serviceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{getServiceTypeLabel(type, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('accountNumber', lang)}</Label>
                <Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <div>
                <Label>Customer #</Label>
                <Input value={form.customerNumber} onChange={e => setForm({ ...form, customerNumber: e.target.value })} />
              </div>
              <div>
                <Label>Contract #</Label>
                <Input value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('monthlyExpected', lang)}</Label>
                <Input type="number" value={form.monthlyExpectedAmount} onChange={e => setForm({ ...form, monthlyExpectedAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('outstandingBalance', lang)}</Label>
                <Input type="number" value={form.currentOutstandingBalance} onChange={e => setForm({ ...form, currentOutstandingBalance: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('nextDue', lang)}</Label>
                <Input type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
              </div>
              <div>
                <Label>{t('billingFrequency', lang)}</Label>
                <Select value={form.billingFrequency} onValueChange={v => setForm({ ...form, billingFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLING_FREQUENCIES.map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {freq === 'monthly' ? t('monthly', lang) : freq === 'quarterly' ? t('quarterly', lang) : t('annually', lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('gracePeriod', lang)}</Label>
                <Input type="number" value={form.gracePeriodDays} onChange={e => setForm({ ...form, gracePeriodDays: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={form.autoRenew}
                  onChange={e => setForm({ ...form, autoRenew: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="autoRenew">{t('autoRenew', lang)}</Label>
              </div>
            </div>
            <div>
              <Label>{t('internalNotes', lang)}</Label>
              <Input value={form.internalNotes} onChange={e => setForm({ ...form, internalNotes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.providerName || !form.propertyId || form.monthlyExpectedAmount <= 0}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-500" /> {t('recordPayment', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show which cycle the payment applies to */}
            {payingBill && payingBill.latestCycle && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{t('currentCycle', lang)}: #{payingBill.latestCycle.cycleNumber}</p>
                <p><span className="text-muted-foreground">{t('cycleOutstanding', lang)}:</span> <span className="font-semibold text-terracotta">{maskedAmount(Number(payingBill.latestCycle.outstandingAmount))}</span></p>
                <p><span className="text-muted-foreground">{t('amountDue', lang)}:</span> <span className="font-semibold">{maskedAmount(Number(payingBill.latestCycle.amount))}</span></p>
              </div>
            )}
            <div>
              <Label>{t('paymentAmount', lang)} (AED)</Label>
              <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('notes', lang) && 'Payment Date'}</Label>
              <Input type="date" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
            </div>
            <div>
              <Label>{t('paymentMethod', lang)}</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{getPaymentMethodLabel(m, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('referenceNumber', lang)}</Label>
              <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>{t('notes', lang)}</Label>
              <Input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handlePay} className="bg-emerald hover:bg-emerald/90 text-white" disabled={payForm.amount <= 0}>
              {t('confirmPayment', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Detail Dialog — Cycle-Centric */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> {t('billDetails', lang)}
            </DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('providerName', lang)}</p>
                  <p className="font-medium">{selectedBill.providerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('serviceType', lang)}</p>
                  <p className="font-medium">{getServiceTypeLabel(selectedBill.serviceType, lang)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('properties', lang)}</p>
                  <p className="font-medium">{selectedBill.property?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('status', lang)}</p>
                  {getStatusBadge(selectedBill.effectiveStatus || selectedBill.status, lang)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('monthlyExpected', lang)}</p>
                  <p className="font-semibold">{maskedAmount(Number(selectedBill.monthlyExpectedAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('outstandingBalance', lang)}</p>
                  <p className="font-semibold text-terracotta">{maskedAmount(Number(selectedBill.currentOutstandingBalance))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('nextDue', lang)}</p>
                  <p className="font-medium">{selectedBill.nextDueDate ? formatDate(selectedBill.nextDueDate) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('billingFrequency', lang)}</p>
                  <p className="font-medium">
                    {selectedBill.billingFrequency === 'monthly' ? t('monthly', lang) : selectedBill.billingFrequency === 'quarterly' ? t('quarterly', lang) : t('annually', lang)}
                  </p>
                </div>
                {selectedBill.accountNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('accountNumber', lang)}</p>
                    <p className="font-medium">{selectedBill.accountNumber}</p>
                  </div>
                )}
                {selectedBill.internalNotes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{t('internalNotes', lang)}</p>
                    <p className="text-sm">{selectedBill.internalNotes}</p>
                  </div>
                )}
              </div>

              {/* Cycle History */}
              {selectedBill.cycles && selectedBill.cycles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> {t('billingCycles', lang)}
                  </h3>
                  <div className="space-y-2">
                    {selectedBill.cycles.map((cycle: any) => {
                      const isExpanded = expandedCycles.has(cycle.id)
                      const cyclePayments = selectedBill.payments?.filter((p: any) => p.billCycleId === cycle.id) || []

                      return (
                        <div key={cycle.id} className="border rounded-lg">
                          <button
                            onClick={() => toggleCycleExpand(cycle.id)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-medium text-sm">{t('cycleNumber', lang)} #{cycle.cycleNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(cycle.periodStart)} — {formatDate(cycle.periodEnd)}
                            </span>
                            <span className="ml-auto flex items-center gap-3">
                              <span className="text-xs">{t('amountDue', lang)}: <span className="font-semibold">{maskedAmount(Number(cycle.amount))}</span></span>
                              <span className="text-xs text-emerald-600">{t('cyclePaid', lang)}: {maskedAmount(Number(cycle.paidAmount))}</span>
                              <span className="text-xs text-terracotta">{t('cycleOutstanding', lang)}: {maskedAmount(Number(cycle.outstandingAmount))}</span>
                              {getStatusBadge(cycle.status, lang)}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="border-t px-3 pb-3">
                              {cyclePayments.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>{t('paymentDate' in {} ? 'noData' : 'noData', lang) || 'Date'}</TableHead>
                                      <TableHead>{t('amount', lang)}</TableHead>
                                      <TableHead>{t('paymentMethod', lang)}</TableHead>
                                      <TableHead>{t('referenceNumber', lang)}</TableHead>
                                      <TableHead>{t('outstanding', lang)}</TableHead>
                                      {canModify && <TableHead className="text-right">{t('status', lang)}</TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cyclePayments.map((p: any) => (
                                      <TableRow key={p.id}>
                                        <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                                        <TableCell className="text-sm font-semibold">{isStaff ? '—' : formatAED(Number(p.amount))}</TableCell>
                                        <TableCell className="text-sm">{p.method ? getPaymentMethodLabel(p.method, lang) : '—'}</TableCell>
                                        <TableCell className="text-sm">{p.reference || '—'}</TableCell>
                                        <TableCell className="text-sm">{isStaff ? '—' : formatAED(Number(p.outstandingAfterPayment))}</TableCell>
                                        {canModify && (
                                          <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <button onClick={() => openEditPayment(p)} className="p-1 rounded hover:bg-muted text-muted-foreground" title={t('editPayment', lang)}>
                                                <Pencil className="w-3 h-3" />
                                              </button>
                                              <button onClick={() => openDeletePayment(p)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500" title={t('deletePayment', lang)}>
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-sm text-muted-foreground py-2 text-center">{t('noPaymentsYet', lang)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Legacy payments not linked to any cycle */}
              {selectedBill.payments && selectedBill.payments.filter((p: any) => !p.billCycleId).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">{t('paymentHistory', lang)}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('paymentDate' in {} ? 'noData' : 'noData', lang) || 'Date'}</TableHead>
                        <TableHead>{t('amount', lang)}</TableHead>
                        <TableHead>{t('paymentMethod', lang)}</TableHead>
                        <TableHead>{t('referenceNumber', lang)}</TableHead>
                        <TableHead>{t('outstanding', lang)}</TableHead>
                        {canModify && <TableHead className="text-right">{t('status', lang)}</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.payments.filter((p: any) => !p.billCycleId).map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell className="text-sm font-semibold">{isStaff ? '—' : formatAED(Number(p.amount))}</TableCell>
                          <TableCell className="text-sm">{p.method ? getPaymentMethodLabel(p.method, lang) : '—'}</TableCell>
                          <TableCell className="text-sm">{p.reference || '—'}</TableCell>
                          <TableCell className="text-sm">{isStaff ? '—' : formatAED(Number(p.outstandingAfterPayment))}</TableCell>
                          {canModify && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openEditPayment(p)} className="p-1 rounded hover:bg-muted text-muted-foreground" title={t('editPayment', lang)}>
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => openDeletePayment(p)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500" title={t('deletePayment', lang)}>
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Advance Cycle Dialog */}
      <Dialog open={advanceCycleDialogOpen} onOpenChange={setAdvanceCycleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" /> {t('advanceCycle', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('advanceCycleDesc', lang)}
            </p>
            {advanceCycleBill && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><span className="text-muted-foreground">{t('monthlyExpected', lang)}:</span> <span className="font-semibold">{maskedAmount(Number(advanceCycleBill.monthlyExpectedAmount))}</span></p>
                <p><span className="text-muted-foreground">{t('billingFrequency', lang)}:</span> <span className="font-medium">{advanceCycleBill.billingFrequency}</span></p>
                <p><span className="text-muted-foreground">{t('nextDue', lang)}:</span> <span className="font-medium">{advanceCycleBill.nextDueDate ? formatDate(advanceCycleBill.nextDueDate) : '—'}</span></p>
              </div>
            )}
            <div>
              <Label>{t('cycleAmount', lang)} (AED)</Label>
              <Input
                type="number"
                value={advanceCycleAmount}
                onChange={e => setAdvanceCycleAmount(Number(e.target.value))}
                placeholder="Enter new cycle amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceCycleDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleAdvanceCycle} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={advanceCycleAmount <= 0}>
              <RotateCcw className="w-4 h-4 mr-2" /> {t('advanceCycle', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editPaymentDialogOpen} onOpenChange={setEditPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> {t('editPayment', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('paymentAmount', lang)} (AED)</Label>
              <Input type="number" value={editPaymentForm.amount} onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('notes', lang) && 'Payment Date'}</Label>
              <Input type="date" value={editPaymentForm.paymentDate} onChange={e => setEditPaymentForm({ ...editPaymentForm, paymentDate: e.target.value })} />
            </div>
            <div>
              <Label>{t('paymentMethod', lang)}</Label>
              <Select value={editPaymentForm.method} onValueChange={v => setEditPaymentForm({ ...editPaymentForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{getPaymentMethodLabel(m, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('referenceNumber', lang)}</Label>
              <Input value={editPaymentForm.reference} onChange={e => setEditPaymentForm({ ...editPaymentForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>{t('notes', lang)}</Label>
              <Input value={editPaymentForm.notes} onChange={e => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPaymentDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleEditPayment} className="bg-emerald hover:bg-emerald/90 text-white" disabled={editPaymentForm.amount <= 0}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <Dialog open={deletePaymentDialogOpen} onOpenChange={setDeletePaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> {t('deletePayment', lang)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('deletePaymentConfirm', lang)}
          </p>
          {deletingPayment && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p><span className="text-muted-foreground">{t('paymentAmount', lang)}:</span> <span className="font-semibold">{maskedAmount(Number(deletingPayment.amount))}</span></p>
              <p><span className="text-muted-foreground">{t('referenceNumber', lang)}:</span> <span className="font-medium">{deletingPayment.reference || '—'}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePaymentDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleDeletePayment} className="bg-red-500 hover:bg-red-600 text-white">
              <Trash2 className="w-4 h-4 mr-2" /> {t('deletePayment', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
