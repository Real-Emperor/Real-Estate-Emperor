'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, formatDate, getMonthName, getStatusColor, getWhatsAppLink, getPropertyTypeLabel } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Pencil, Trash2, Search, MessageCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

export default function Tenants() {
  const { language } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TenantData | null>(null)
  const [form, setForm] = useState({
    name: '', nameAr: '', phone: '', email: '', unitNumber: '',
    propertyId: '', rentAmount: 0, status: 'active', leaseStart: '', leaseEnd: '',
  })

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const fetchData = useCallback(async () => {
    try {
      const [tRes, pRes] = await Promise.all([fetch('/api/tenants'), fetch('/api/properties')])
      if (tRes.ok) setTenants(await tRes.json())
      if (pRes.ok) setProperties(await pRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', nameAr: '', phone: '', email: '', unitNumber: '', propertyId: properties[0]?.id || '', rentAmount: 0, status: 'active', leaseStart: '', leaseEnd: '' })
    setDialogOpen(true)
  }

  const openEdit = (t: TenantData) => {
    setEditing(t)
    setForm({
      name: t.name, nameAr: t.nameAr || '', phone: t.phone, email: t.email || '',
      unitNumber: t.unitNumber || '', propertyId: t.propertyId, rentAmount: t.rentAmount,
      status: t.status, leaseStart: t.leaseStart ? new Date(t.leaseStart).toISOString().split('T')[0] : '',
      leaseEnd: t.leaseEnd ? new Date(t.leaseEnd).toISOString().split('T')[0] : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const body = { ...form, rentAmount: Number(form.rentAmount) }
    if (editing) {
      await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setDialogOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this tenant and all their payments?', 'حذف هذا المستأجر وجميع مدفوعاته؟'))) return
    await fetch(`/api/tenants?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.nameAr && t.nameAr.includes(search)) ||
      t.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('Tenants', 'المستأجرون')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(`${tenants.filter(t => t.status === 'active').length} active tenants`, `${tenants.filter(t => t.status === 'active').length} مستأجر نشط`)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('Add Tenant', 'إضافة مستأجر')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search tenants...', 'بحث المستأجرين...')}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Status', 'كل الحالات')}</SelectItem>
            <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
            <SelectItem value="inactive">{t('Inactive', 'غير نشط')}</SelectItem>
            <SelectItem value="evicted">{t('Evicted', 'مُخلَى')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Tenant', 'المستأجر')}</TableHead>
                  <TableHead>{t('Property / Unit', 'العقار / الوحدة')}</TableHead>
                  <TableHead>{t('Rent', 'الإيجار')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                  <TableHead>{t('Last Payment', 'آخر دفعة')}</TableHead>
                  <TableHead className="text-right">{t('Actions', 'إجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => {
                  const payments = tenant.payments || []
                  const lastPayment = payments.length > 0 ? payments[0] : null
                  const currentMonthPaid = payments.some(p => p.month === currentMonth && p.year === currentYear)
                  const isExpanded = expandedTenant === tenant.id

                  return (
                    <>
                      <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedTenant(isExpanded ? null : tenant.id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-semibold text-xs">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {language === 'ar' && tenant.nameAr ? tenant.nameAr : tenant.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{tenant.property?.name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{tenant.unitNumber || '—'}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{formatAED(tenant.rentAmount)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(tenant.status)}`}>
                            {tenant.status === 'active' ? t('Active', 'نشط') :
                             tenant.status === 'inactive' ? t('Inactive', 'غير نشط') :
                             t('Evicted', 'مُخلَى')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lastPayment ? (
                            <div>
                              <p className="text-sm">{formatAED(lastPayment.amount)}</p>
                              <p className="text-xs text-muted-foreground">{getMonthName(lastPayment.month, language)} {lastPayment.year}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t('No payments', 'لا مدفوعات')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {tenant.status === 'active' && !currentMonthPaid && (
                              <a
                                href={getWhatsAppLink(tenant.phone, tenant.name, tenant.rentAmount, currentMonth, currentYear, language)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-green-50 text-green-600"
                                title={t('Send WhatsApp Reminder', 'إرسال تذكير واتساب')}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => openEdit(tenant)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(tenant.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded payment history */}
                      {isExpanded && (
                        <TableRow key={`${tenant.id}-expanded`}>
                          <TableCell colSpan={6} className="bg-muted/20 p-4">
                            <h4 className="font-semibold text-sm mb-2">{t('Payment History', 'سجل المدفوعات')}</h4>
                            {payments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('No payments recorded', 'لا توجد مدفوعات')}</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {payments.slice(0, 12).map(p => (
                                  <div key={p.id} className="bg-white rounded-lg p-2 border text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{formatAED(p.amount)}</span>
                                      <Badge variant="secondary" className="text-xs">{p.method || '—'}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {getMonthName(p.month, language)} {p.year}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('No tenants found', 'لم يتم العثور على مستأجرين')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit Tenant', 'تعديل المستأجر') : t('Add Tenant', 'إضافة مستأجر')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('Name', 'الاسم')}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>{t('Arabic Name', 'الاسم بالعربية')}</Label>
                <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('Phone', 'الهاتف')}</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+971501234567" />
              </div>
              <div>
                <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('Property', 'العقار')}</Label>
                <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                  <SelectTrigger><SelectValue placeholder={t('Select property', 'اختر العقار')} /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('Unit Number', 'رقم الوحدة')}</Label>
                <Input value={form.unitNumber} onChange={e => setForm({ ...form, unitNumber: e.target.value })} placeholder="Apt 201" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('Monthly Rent (AED)', 'الإيجار الشهري (درهم)')}</Label>
                <Input type="number" value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('Status', 'الحالة')}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
                    <SelectItem value="inactive">{t('Inactive', 'غير نشط')}</SelectItem>
                    <SelectItem value="evicted">{t('Evicted', 'مُخلَى')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('Lease Start', 'بداية العقد')}</Label>
                <Input type="date" value={form.leaseStart} onChange={e => setForm({ ...form, leaseStart: e.target.value })} />
              </div>
              <div>
                <Label>{t('Lease End', 'نهاية العقد')}</Label>
                <Input type="date" value={form.leaseEnd} onChange={e => setForm({ ...form, leaseEnd: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.name || !form.phone || !form.propertyId}>
              {t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
