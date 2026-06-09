'use client'

import { useEffect, useState, useCallback } from 'react'
import type { RecurringBillData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, cn2 } from '@/lib/utils'
import { t, getNameByLang, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Zap, Plus, Pencil, Trash2, Loader2, Download, Eye, Banknote, FileSpreadsheet, FileText, AlertTriangle, CheckCircle2, Clock, XCircle, RotateCcw, History } from 'lucide-react'

const SERVICE_TYPES = ['electricity', 'water', 'gas', 'internet', 'cooling', 'chiller', 'parking', 'waste', 'other'] as const
const BILLING_FREQUENCIES = ['monthly', 'quarterly', 'annually'] as const
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'online'] as const
const STATUS_TABS = ['all', 'active', 'overdue', 'paid', 'partially_paid'] as const

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

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-500 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>
    case 'overdue':
      return <Badge className="bg-red-500 text-white text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>
    case 'partially_paid':
      return <Badge className="bg-amber-500 text-white text-xs"><Clock className="w-3 h-3 mr-1" />Partial</Badge>
    case 'active':
      return <Badge className="bg-blue-500 text-white text-xs"><Zap className="w-3 h-3 mr-1" />Active</Badge>
    case 'cancelled':
      return <Badge className="bg-gray-400 text-white text-xs"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
    case 'pending':
      return <Badge className="bg-slate-400 text-white text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

export default function RecurringBills() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [bills, setBills] = useState<RecurringBillData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [advanceCycleDialogOpen, setAdvanceCycleDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringBillData | null>(null)
  const [selectedBill, setSelectedBill] = useState<RecurringBillData | null>(null)
  const [advanceCycleBill, setAdvanceCycleBill] = useState<RecurringBillData | null>(null)
  const [advanceCycleAmount, setAdvanceCycleAmount] = useState(0)

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

  const canModify = authUser && isOwnerOrAdmin(authUser.role)
  const isStaff = authUser?.role === 'staff'

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const store = useDataStore.getState()
      setProperties(store.getPropertiesWithTenants())

      const params = new URLSearchParams()
      params.set('limit', '1000')
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (propertyFilter !== 'all') params.set('propertyId', propertyFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/recurring-bills?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const billList = data.data || data || []
        setBills(Array.isArray(billList) ? billList : [])
      } else {
        setBills(store.recurringBills)
      }
    } catch (e) {
      console.error(e)
      try {
        const store = useDataStore.getState()
        setBills(store.recurringBills)
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [statusFilter, propertyFilter, search])

  useEffect(() => { fetchBills() }, [fetchBills])

  // Summary calculations
  const totalBills = bills.length
  const outstandingBalance = bills.reduce((s, b) => s + Number(b.currentOutstandingBalance || 0), 0)
  const paidThisMonth = bills.filter(b => b.status === 'paid').length
  const overdueCount = bills.filter(b => b.status === 'overdue').length

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

  const openEdit = (bill: RecurringBillData) => {
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

  const openPay = (bill: RecurringBillData) => {
    setPayForm({
      recurringBillId: bill.id,
      amount: Number(bill.currentOutstandingBalance || bill.monthlyExpectedAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: '',
    })
    setPayDialogOpen(true)
  }

  const openDetail = async (bill: RecurringBillData) => {
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
      alert('Failed to save bill. Please try again.')
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
      alert('Failed to record payment. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring bill?')) return
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

  const openAdvanceCycle = (bill: RecurringBillData) => {
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
      alert('Failed to advance cycle. Please try again.')
    }
  }

  // Mask financial amounts for staff
  const maskedAmount = (amount: number) => isStaff ? '—' : formatAED(amount)

  if (loading && bills.length === 0) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Recurring Bills & Utilities
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalBills} bills tracked
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
              Add Bill
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search Bills, Providers, Properties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-4"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Bills</p>
            <p className="text-2xl font-bold">{totalBills}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold text-terracotta">{maskedAmount(outstandingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid This Month</p>
            <p className="text-2xl font-bold text-emerald-600">{paidThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
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
            {tab === 'all' ? 'All' : tab === 'partially_paid' ? 'Partially Paid' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}

        <div className="ml-auto">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Monthly Amount</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map(bill => (
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
                    <TableCell className="font-semibold text-sm">{maskedAmount(Number(bill.monthlyExpectedAmount))}</TableCell>
                    <TableCell className="text-sm text-terracotta font-medium">{maskedAmount(Number(bill.currentOutstandingBalance))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bill.lastPaymentDate ? formatDate(bill.lastPaymentDate) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bill.nextDueDate ? formatDate(bill.nextDueDate) : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(bill)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canModify && (
                          <>
                            <button onClick={() => openAdvanceCycle(bill)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title="Advance Cycle">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openPay(bill)} className="p-1.5 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600" title="Record Payment">
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openEdit(bill)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(bill.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {bills.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recurring bills found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Bill Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Bill' : 'Add Bill'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Property</Label>
              <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Name</Label>
                <Input value={form.providerName} onChange={e => setForm({ ...form, providerName: e.target.value })} placeholder="e.g. DEWA" />
              </div>
              <div>
                <Label>Service Type</Label>
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
                <Label>Account Number</Label>
                <Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <div>
                <Label>Customer Number</Label>
                <Input value={form.customerNumber} onChange={e => setForm({ ...form, customerNumber: e.target.value })} />
              </div>
              <div>
                <Label>Contract Number</Label>
                <Input value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Expected Amount (AED)</Label>
                <Input type="number" value={form.monthlyExpectedAmount} onChange={e => setForm({ ...form, monthlyExpectedAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Current Outstanding (AED)</Label>
                <Input type="number" value={form.currentOutstandingBalance} onChange={e => setForm({ ...form, currentOutstandingBalance: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Next Due Date</Label>
                <Input type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
              </div>
              <div>
                <Label>Billing Frequency</Label>
                <Select value={form.billingFrequency} onValueChange={v => setForm({ ...form, billingFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLING_FREQUENCIES.map(freq => (
                      <SelectItem key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grace Period (Days)</Label>
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
                <Label htmlFor="autoRenew">Auto Renew</Label>
              </div>
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Input value={form.internalNotes} onChange={e => setForm({ ...form, internalNotes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.providerName || !form.propertyId || form.monthlyExpectedAmount <= 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Amount (AED)</Label>
              <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference</Label>
              <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} className="bg-emerald hover:bg-emerald/90 text-white" disabled={payForm.amount <= 0}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="font-medium">{selectedBill.providerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="font-medium">{getServiceTypeLabel(selectedBill.serviceType, lang)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="font-medium">{selectedBill.property?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedBill.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Expected</p>
                  <p className="font-semibold">{maskedAmount(Number(selectedBill.monthlyExpectedAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="font-semibold text-terracotta">{maskedAmount(Number(selectedBill.currentOutstandingBalance))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount Due</p>
                  <p className="font-semibold">{maskedAmount(Number(selectedBill.totalAmountDue))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Due Date</p>
                  <p className="font-medium">{selectedBill.nextDueDate ? formatDate(selectedBill.nextDueDate) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Frequency</p>
                  <p className="font-medium">{selectedBill.billingFrequency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Payment</p>
                  <p className="font-medium">{selectedBill.lastPaymentDate ? formatDate(selectedBill.lastPaymentDate) : '—'}</p>
                </div>
                {selectedBill.accountNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium">{selectedBill.accountNumber}</p>
                  </div>
                )}
                {selectedBill.customerNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Number</p>
                    <p className="font-medium">{selectedBill.customerNumber}</p>
                  </div>
                )}
              </div>
              {selectedBill.internalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Internal Notes</p>
                  <p className="text-sm">{selectedBill.internalNotes}</p>
                </div>
              )}

              {/* Payment History */}
              {selectedBill.payments && selectedBill.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Payment History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Outstanding After</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell className="text-sm font-semibold">{isStaff ? '—' : formatAED(Number(p.amount))}</TableCell>
                          <TableCell className="text-sm">{p.method || '—'}</TableCell>
                          <TableCell className="text-sm">{isStaff ? '—' : formatAED(Number(p.outstandingAfterPayment))}</TableCell>
                          <TableCell className="text-sm">{p.reference || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Billing Cycles History */}
              {selectedBill.cycles && selectedBill.cycles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" /> Billing Cycles
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cycle #</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.cycles.map((cycle: any) => (
                        <TableRow key={cycle.id}>
                          <TableCell className="text-sm font-medium">#{cycle.cycleNumber}</TableCell>
                          <TableCell className="text-xs">
                            {formatDate(cycle.periodStart)} — {formatDate(cycle.periodEnd)}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(cycle.dueDate)}</TableCell>
                          <TableCell className="text-sm font-semibold">{maskedAmount(Number(cycle.amount))}</TableCell>
                          <TableCell className="text-sm text-emerald-600">{maskedAmount(Number(cycle.paidAmount))}</TableCell>
                          <TableCell className="text-sm text-terracotta font-medium">{maskedAmount(Number(cycle.outstandingAmount))}</TableCell>
                          <TableCell>{getStatusBadge(cycle.status)}</TableCell>
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
              <RotateCcw className="w-5 h-5 text-blue-500" /> Advance Billing Cycle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a new billing cycle for {advanceCycleBill?.providerName}. Previous cycles are preserved with their original amounts.
            </p>
            {advanceCycleBill && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><span className="text-muted-foreground">Current Amount:</span> <span className="font-semibold">{maskedAmount(Number(advanceCycleBill.monthlyExpectedAmount))}</span></p>
                <p><span className="text-muted-foreground">Frequency:</span> <span className="font-medium">{advanceCycleBill.billingFrequency}</span></p>
                <p><span className="text-muted-foreground">Next Due:</span> <span className="font-medium">{advanceCycleBill.nextDueDate ? formatDate(advanceCycleBill.nextDueDate) : '—'}</span></p>
              </div>
            )}
            <div>
              <Label>New Cycle Amount (AED)</Label>
              <Input
                type="number"
                value={advanceCycleAmount}
                onChange={e => setAdvanceCycleAmount(Number(e.target.value))}
                placeholder="Enter new cycle amount"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This can differ from the previous cycle amount — each cycle has its own amount.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceCycleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdvanceCycle} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={advanceCycleAmount <= 0}>
              <RotateCcw className="w-4 h-4 mr-2" /> Advance Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
