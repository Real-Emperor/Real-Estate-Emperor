'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { t, getNameByLang, getWhatsAppLink, getTenantScoreLabel, getTenantScoreColor, type Language, type WhatsAppLanguage } from '@/lib/i18n'
import { cn2, formatAED, formatDate, getStatusColor } from '@/lib/utils'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users, Plus, Pencil, Trash2, Search, MessageCircle,
  ChevronDown, ChevronUp, Loader2, Phone, Mail,
  MapPin, CreditCard, Shield, AlertTriangle, Clock,
  Building, Ruler, FileText, Star, ExternalLink
} from 'lucide-react'

interface TenantFormState {
  name: string
  nameAr: string
  nameBn: string
  nameUr: string
  phone: string
  whatsapp: string
  email: string
  emiratesId: string
  nationality: string
  employer: string
  emergencyContact: string
  propertyId: string
  unitNumber: string
  unitType: string
  floor: string
  sizeSqft: string
  rentAmount: string
  municipalityFee: string
  securityDeposit: string
  paymentMethod: string
  leaseStart: string
  leaseEnd: string
  contractDuration: string
  status: string
  notes: string
}

const emptyForm: TenantFormState = {
  name: '', nameAr: '', nameBn: '', nameUr: '',
  phone: '', whatsapp: '', email: '', emiratesId: '',
  nationality: '', employer: '', emergencyContact: '',
  propertyId: '', unitNumber: '', unitType: '', floor: '',
  sizeSqft: '', rentAmount: '0', municipalityFee: '',
  securityDeposit: '', paymentMethod: '', leaseStart: '',
  leaseEnd: '', contractDuration: '', status: 'active', notes: '',
}

const unitTypes = ['studio', '1bedroom', '2bedroom', '3bedroom', 'shop', 'office']
const paymentMethods = ['cash', 'bank_transfer', 'cheque']
const statusOptions = ['active', 'inactive', 'evicted', 'notice']

function getUnitTypeLabel(type: string, lang: Language): string {
  switch (type) {
    case 'studio': return t('studio', lang)
    case '1bedroom': return t('oneBedroom', lang)
    case '2bedroom': return t('twoBedroom', lang)
    case '3bedroom': return t('threeBedroom', lang)
    case 'shop': return t('shop', lang)
    case 'office': return t('office', lang)
    default: return type
  }
}

function getPaymentMethodLabel(method: string, lang: Language): string {
  switch (method) {
    case 'cash': return t('cash', lang)
    case 'bank_transfer': return t('bankTransfer', lang)
    case 'cheque': return t('cheque', lang)
    default: return method
  }
}

function getStatusLabel(status: string, lang: Language): string {
  switch (status) {
    case 'active': return t('active', lang)
    case 'inactive': return t('inactive2', lang)
    case 'evicted': return t('evicted', lang)
    case 'notice': return t('notice', lang)
    default: return status
  }
}

export default function Tenants() {
  const { language, authUser } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TenantData | null>(null)
  const [form, setForm] = useState<TenantFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Profile dialog
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTenant, setProfileTenant] = useState<TenantData | null>(null)

  // WhatsApp language selection dialog
  const [whatsappLangDialogOpen, setWhatsappLangDialogOpen] = useState(false)
  const [whatsappTargetTenant, setWhatsappTargetTenant] = useState<TenantData | null>(null)
  const [whatsappRemindAll, setWhatsappRemindAll] = useState(false)

  const isPrivileged = authUser ? isOwnerOrAdmin(authUser.role) : true

  const fetchData = useCallback(() => {
    try {
      const store = useDataStore.getState()
      setTenants(store.getTenantsWithRelations())
      setProperties(store.getPropertiesWithTenants())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, propertyId: properties[0]?.id || '' })
    setDialogOpen(true)
  }

  const openEdit = (tenant: TenantData) => {
    setEditing(tenant)
    setForm({
      name: tenant.name,
      nameAr: tenant.nameAr || '',
      nameBn: tenant.nameBn || '',
      nameUr: tenant.nameUr || '',
      phone: tenant.phone,
      whatsapp: tenant.whatsapp || '',
      email: tenant.email || '',
      emiratesId: tenant.emiratesId || '',
      nationality: tenant.nationality || '',
      employer: tenant.employer || '',
      emergencyContact: tenant.emergencyContact || '',
      propertyId: tenant.propertyId,
      unitNumber: tenant.unitNumber || '',
      unitType: tenant.unitType || '',
      floor: tenant.floor != null ? String(tenant.floor) : '',
      sizeSqft: tenant.sizeSqft != null ? String(tenant.sizeSqft) : '',
      rentAmount: String(tenant.rentAmount),
      municipalityFee: tenant.municipalityFee != null ? String(tenant.municipalityFee) : '',
      securityDeposit: tenant.securityDeposit != null ? String(tenant.securityDeposit) : '',
      paymentMethod: tenant.paymentMethod || '',
      leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart).toISOString().split('T')[0] : '',
      leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd).toISOString().split('T')[0] : '',
      contractDuration: tenant.contractDuration != null ? String(tenant.contractDuration) : '',
      status: tenant.status,
      notes: tenant.notes || '',
    })
    setDialogOpen(true)
  }

  const openProfile = (tenant: TenantData) => {
    setProfileTenant(tenant)
    setProfileOpen(true)
  }

  const handleSave = () => {
    setSaving(true)
    try {
      const store = useDataStore.getState()
      const rentAmount = Number(form.rentAmount) || 0
      const muniFee = form.municipalityFee ? Number(form.municipalityFee) : Math.round(rentAmount * 0.05)
      const body: any = {
        ...form,
        rentAmount,
        municipalityFee: muniFee,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null,
        floor: form.floor ? Number(form.floor) : null,
        sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : null,
        contractDuration: form.contractDuration ? Number(form.contractDuration) : null,
      }
      if (editing) {
        store.updateTenant(editing.id, body)
      } else {
        store.addTenant(body)
      }
      setDialogOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteTenant', language))) return
    useDataStore.getState().deleteTenant(id)
    fetchData()
  }

  const updateForm = (field: keyof TenantFormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-calculate municipality fee when rent changes
      if (field === 'rentAmount' && !prev.municipalityFee) {
        next.municipalityFee = String(Math.round((Number(value) || 0) * 0.05))
      }
      return next
    })
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const activeCount = tenants.filter(t => t.status === 'active').length

  const filtered = tenants.filter(t => {
    const name = getNameByLang(t, language).toLowerCase()
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      (t.nameAr && t.nameAr.includes(search)) ||
      (t.nameBn && t.nameBn.includes(search)) ||
      (t.nameUr && t.nameUr.includes(search)) ||
      t.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      (t.emiratesId && t.emiratesId.includes(search))
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('tenants', language)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} {t('activeTenants', language).toLowerCase()}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTenant', language)}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchTenants', language)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus', language)}</SelectItem>
            <SelectItem value="active">{t('active', language)}</SelectItem>
            <SelectItem value="inactive">{t('inactive2', language)}</SelectItem>
            <SelectItem value="evicted">{t('evicted', language)}</SelectItem>
            <SelectItem value="notice">{t('notice', language)}</SelectItem>
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
                  <TableHead>{t('tenantName', language)}</TableHead>
                  <TableHead>{t('propertyUnit', language)}</TableHead>
                  <TableHead>{t('rent', language)}</TableHead>
                  <TableHead>{t('tenantScore', language)}</TableHead>
                  <TableHead>{t('status', language)}</TableHead>
                  <TableHead>{t('lastPayment', language)}</TableHead>
                  <TableHead className="text-right">{t('actions', language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => {
                  const payments = tenant.payments || []
                  const lastPayment = payments.length > 0 ? payments[0] : null
                  const currentMonthPaid = payments.some(p => p.month === currentMonth && p.year === currentYear)
                  const isExpanded = expandedTenant === tenant.id
                  const displayName = getNameByLang(tenant, language)

                  return (
                    <>
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => openProfile(tenant)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={cn2(
                                'text-xs font-semibold',
                                tenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                tenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-700' :
                                tenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>
                                {displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{displayName}</p>
                              <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{getNameByLang(tenant.property || { name: '—' }, language)}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.unitNumber || '—'}
                            {tenant.unitType ? ` · ${getUnitTypeLabel(tenant.unitType, language)}` : ''}
                          </p>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{formatAED(tenant.rentAmount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn2('text-xs font-bold px-2 py-0.5', getTenantScoreColor(tenant.tenantScore))}>
                              {tenant.tenantScore}
                            </Badge>
                            {tenant.latePaymentCount > 0 && (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-600 px-1.5 py-0.5">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />
                                {tenant.latePaymentCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn2('text-xs', getStatusColor(tenant.status))}>
                            {getStatusLabel(tenant.status, language)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lastPayment ? (
                            <div>
                              <p className="text-sm">{formatAED(lastPayment.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {lastPayment.isLate && (
                                  <span className="text-red-500 mr-1">⚠</span>
                                )}
                                {formatDate(lastPayment.date)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t('noPayments', language)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {tenant.status === 'active' && !currentMonthPaid && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setWhatsappTargetTenant(tenant); setWhatsappRemindAll(false); setWhatsappLangDialogOpen(true) }}
                                className="p-1.5 rounded hover:bg-green-50 text-green-600"
                                title={t('sendWhatsAppReminder', language)}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(tenant) }}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {isPrivileged && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(tenant.id) }}
                                className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedTenant(isExpanded ? null : tenant.id) }}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded payment history */}
                      {isExpanded && (
                        <TableRow key={`${tenant.id}-expanded`}>
                          <TableCell colSpan={7} className="bg-muted/20 p-4">
                            <h4 className="font-semibold text-sm mb-3">{t('paymentHistory', language)}</h4>
                            {payments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('noPayments', language)}</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {payments.slice(0, 24).map(p => (
                                  <div key={p.id} className={cn2(
                                    'rounded-lg p-2 border text-sm',
                                    p.isLate ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                  )}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{formatAED(p.amount)}</span>
                                      {p.isLate && (
                                        <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 px-1 py-0">
                                          {t('late', language)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                                      {p.method && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                          {getPaymentMethodLabel(p.method, language)}
                                        </Badge>
                                      )}
                                    </div>
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
              {t('noTenantsFound', language)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== TENANT PROFILE DIALOG ===================== */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {profileTenant && (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={cn2(
                      'text-sm font-semibold',
                      profileTenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      profileTenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-700' :
                      profileTenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {getNameByLang(profileTenant, language).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{t('tenantProfile', language)}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {getNameByLang(profileTenant, language)}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {profileTenant && (
            <ScrollArea className="max-h-[70vh] pr-1">
              <div className="space-y-5 pb-4">
                {/* Score & Late Payments - Prominent */}
                <div className="flex gap-3 flex-wrap">
                  <div className={cn2(
                    'flex items-center gap-2 rounded-lg px-4 py-2',
                    profileTenant.tenantScore >= 80 ? 'bg-emerald-50 border border-emerald-200' :
                    profileTenant.tenantScore >= 60 ? 'bg-blue-50 border border-blue-200' :
                    profileTenant.tenantScore >= 40 ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  )}>
                    <Star className={cn2(
                      'w-5 h-5',
                      profileTenant.tenantScore >= 80 ? 'text-emerald-600' :
                      profileTenant.tenantScore >= 60 ? 'text-blue-600' :
                      profileTenant.tenantScore >= 40 ? 'text-amber-600' :
                      'text-red-600'
                    )} />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('tenantScore', language)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{profileTenant.tenantScore}</span>
                        <Badge className={cn2('text-xs', getTenantScoreColor(profileTenant.tenantScore))}>
                          {getTenantScoreLabel(profileTenant.tenantScore, language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={cn2(
                    'flex items-center gap-2 rounded-lg px-4 py-2',
                    profileTenant.latePaymentCount > 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  )}>
                    <Clock className={cn2(
                      'w-5 h-5',
                      profileTenant.latePaymentCount > 0 ? 'text-red-600' : 'text-emerald-600'
                    )} />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('latePayments', language)}</p>
                      <span className={cn2(
                        'text-xl font-bold',
                        profileTenant.latePaymentCount > 0 ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {profileTenant.latePaymentCount}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    {t('personalInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('tenantName', language)} value={getNameByLang(profileTenant, language)} />
                    {profileTenant.emiratesId && (
                      <ProfileField label={t('emiratesId', language)} value={profileTenant.emiratesId} icon={<Shield className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.nationality && (
                      <ProfileField label={t('nationality', language)} value={profileTenant.nationality} />
                    )}
                    {profileTenant.employer && (
                      <ProfileField label={t('employer2', language)} value={profileTenant.employer} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    {t('contactInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('phone', language)} value={profileTenant.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                    {profileTenant.whatsapp && (
                      <ProfileField
                        label={t('whatsapp', language)}
                        value={profileTenant.whatsapp}
                        icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                      />
                    )}
                    {profileTenant.email && (
                      <ProfileField label={t('email', language)} value={profileTenant.email} icon={<Mail className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.emergencyContact && (
                      <ProfileField label={t('emergencyContact', language)} value={profileTenant.emergencyContact} icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Lease & Property Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    {t('leaseInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField
                      label={t('building', language)}
                      value={profileTenant.property ? getNameByLang(profileTenant.property, language) : '—'}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                    />
                    <ProfileField label={t('unitNumber', language)} value={profileTenant.unitNumber || '—'} />
                    {profileTenant.unitType && (
                      <ProfileField label={t('unitType', language)} value={getUnitTypeLabel(profileTenant.unitType, language)} />
                    )}
                    {profileTenant.floor != null && (
                      <ProfileField label={t('floor2', language)} value={String(profileTenant.floor)} />
                    )}
                    {profileTenant.sizeSqft != null && (
                      <ProfileField label={t('sizeSqft', language)} value={`${profileTenant.sizeSqft} sqft`} icon={<Ruler className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.leaseStart && (
                      <ProfileField label={t('leaseStart', language)} value={formatDate(profileTenant.leaseStart)} icon={<Clock className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.leaseEnd && (
                      <ProfileField label={t('leaseEnd', language)} value={formatDate(profileTenant.leaseEnd)} />
                    )}
                    {profileTenant.contractDuration != null && (
                      <ProfileField label={t('contractDuration', language)} value={`${profileTenant.contractDuration} ${t('months', language)}`} icon={<FileText className="w-3.5 h-3.5" />} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Financial Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    {t('financialInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('monthlyRent', language)} value={formatAED(profileTenant.rentAmount)} />
                    {profileTenant.municipalityFee != null && (
                      <ProfileField label={t('municipalityFee', language)} value={formatAED(profileTenant.municipalityFee)} />
                    )}
                    {isPrivileged && profileTenant.securityDeposit != null && (
                      <ProfileField label={t('securityDeposit', language)} value={formatAED(profileTenant.securityDeposit)} />
                    )}
                    {profileTenant.paymentMethod && (
                      <ProfileField label={t('paymentMethod', language)} value={getPaymentMethodLabel(profileTenant.paymentMethod, language)} />
                    )}
                  </div>
                </div>

                {/* Notes */}
                {profileTenant.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">{t('notes', language)}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profileTenant.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Payment History */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">{t('paymentHistory', language)}</h3>
                  {(profileTenant.payments || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('noPayments', language)}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {(profileTenant.payments || []).map(p => (
                        <div key={p.id} className={cn2(
                          'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                          p.isLate ? 'bg-red-50' : 'bg-muted/50'
                        )}>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{formatAED(p.amount)}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                            {p.method && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {getPaymentMethodLabel(p.method, language)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.isLate && (
                              <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 px-1.5 py-0">
                                {t('late', language)} {p.daysLate > 0 ? `(${p.daysLate}d)` : ''}
                              </Badge>
                            )}
                            {!p.isLate && (
                              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 px-1.5 py-0">
                                {t('onTime', language)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WhatsApp Reminder Button */}
                {profileTenant.status === 'active' && (
                  <div className="pt-2">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50" onClick={() => { setWhatsappTargetTenant(profileTenant); setWhatsappRemindAll(false); setWhatsappLangDialogOpen(true) }}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t('sendWhatsAppReminder', language)}
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== ADD/EDIT TENANT DIALOG ===================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editTenant', language) : t('addTenant', language)}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-6 pb-4">
              {/* Name Fields - 4 Languages */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  {t('tenantName', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('nameEnglish', language)} *</Label>
                    <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>{t('nameArabic', language)}</Label>
                    <Input value={form.nameAr} onChange={e => updateForm('nameAr', e.target.value)} dir="rtl" placeholder="جون دو" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  {t('contactInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('phone', language)} *</Label>
                    <Input value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+971501234567" />
                  </div>
                  <div>
                    <Label>{t('whatsapp', language)}</Label>
                    <Input value={form.whatsapp} onChange={e => updateForm('whatsapp', e.target.value)} placeholder="+971501234567" />
                  </div>
                  <div>
                    <Label>{t('email', language)}</Label>
                    <Input value={form.email} onChange={e => updateForm('email', e.target.value)} type="email" placeholder="tenant@email.com" />
                  </div>
                  <div>
                    <Label>{t('emergencyContact', language)}</Label>
                    <Input value={form.emergencyContact} onChange={e => updateForm('emergencyContact', e.target.value)} placeholder="+971501234567" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  {t('personalInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('emiratesId', language)}</Label>
                    <Input value={form.emiratesId} onChange={e => updateForm('emiratesId', e.target.value)} placeholder="784-1990-1234567-1" />
                  </div>
                  <div>
                    <Label>{t('nationality', language)}</Label>
                    <Input value={form.nationality} onChange={e => updateForm('nationality', e.target.value)} placeholder="UAE, Indian, Pakistani..." />
                  </div>
                  <div>
                    <Label>{t('employer2', language)}</Label>
                    <Input value={form.employer} onChange={e => updateForm('employer', e.target.value)} placeholder="Company name" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property & Unit */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  {t('leaseInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('propertyName', language)} *</Label>
                    <Select value={form.propertyId} onValueChange={v => updateForm('propertyId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectProperty', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.filter(p => !p.archived).map(p => (
                          <SelectItem key={p.id} value={p.id}>{getNameByLang(p, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('unitNumber', language)}</Label>
                    <Input value={form.unitNumber} onChange={e => updateForm('unitNumber', e.target.value)} placeholder="Apt 201" />
                  </div>
                  <div>
                    <Label>{t('unitType', language)}</Label>
                    <Select value={form.unitType} onValueChange={v => updateForm('unitType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('unitType', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map(ut => (
                          <SelectItem key={ut} value={ut}>{getUnitTypeLabel(ut, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('floor2', language)}</Label>
                    <Input type="number" value={form.floor} onChange={e => updateForm('floor', e.target.value)} placeholder="3" />
                  </div>
                  <div>
                    <Label>{t('sizeSqft', language)}</Label>
                    <Input type="number" value={form.sizeSqft} onChange={e => updateForm('sizeSqft', e.target.value)} placeholder="850" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {t('financialInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('monthlyRent', language)} *</Label>
                    <Input
                      type="number"
                      value={form.rentAmount}
                      onChange={e => updateForm('rentAmount', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t('municipalityFee', language)}</Label>
                    <Input
                      type="number"
                      value={form.municipalityFee}
                      onChange={e => updateForm('municipalityFee', e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{t('autoCalc', language)}</p>
                  </div>
                  {isPrivileged && (
                    <div>
                      <Label>{t('securityDeposit', language)}</Label>
                      <Input
                        type="number"
                        value={form.securityDeposit}
                        onChange={e => updateForm('securityDeposit', e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <Label>{t('paymentMethod', language)}</Label>
                    <Select value={form.paymentMethod} onValueChange={v => updateForm('paymentMethod', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('paymentMethod', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(pm => (
                          <SelectItem key={pm} value={pm}>{getPaymentMethodLabel(pm, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('leaseStart', language)}</Label>
                  <Input type="date" value={form.leaseStart} onChange={e => updateForm('leaseStart', e.target.value)} />
                </div>
                <div>
                  <Label>{t('leaseEnd', language)}</Label>
                  <Input type="date" value={form.leaseEnd} onChange={e => updateForm('leaseEnd', e.target.value)} />
                </div>
                <div>
                  <Label>{t('contractDuration', language)}</Label>
                  <Input type="number" value={form.contractDuration} onChange={e => updateForm('contractDuration', e.target.value)} placeholder="12" />
                </div>
                <div>
                  <Label>{t('status', language)}</Label>
                  <Select value={form.status} onValueChange={v => updateForm('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{getStatusLabel(s, language)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>{t('notes', language)}</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  placeholder={t('notes', language)}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!form.name || !form.phone || !form.propertyId || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== WHATSAPP LANGUAGE SELECTION DIALOG ===================== */}
      <Dialog open={whatsappLangDialogOpen} onOpenChange={setWhatsappLangDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              {t('selectReminderLanguage', language)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">{t('reminderLanguageDesc', language)}</p>
            <div className="space-y-2">
              <Button
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  if (whatsappTargetTenant) {
                    window.open(getWhatsAppLink(whatsappTargetTenant.whatsapp || whatsappTargetTenant.phone, getNameByLang(whatsappTargetTenant, language), whatsappTargetTenant.rentAmount, currentMonth, currentYear, 'ar'), '_blank')
                  }
                  setWhatsappLangDialogOpen(false)
                }}
              >
                {t('sendArabic', language)}
              </Button>
              <Button
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  if (whatsappTargetTenant) {
                    window.open(getWhatsAppLink(whatsappTargetTenant.whatsapp || whatsappTargetTenant.phone, getNameByLang(whatsappTargetTenant, language), whatsappTargetTenant.rentAmount, currentMonth, currentYear, 'en'), '_blank')
                  }
                  setWhatsappLangDialogOpen(false)
                }}
              >
                {t('sendEnglish', language)}
              </Button>
              <Button
                className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => {
                  if (whatsappTargetTenant) {
                    window.open(getWhatsAppLink(whatsappTargetTenant.whatsapp || whatsappTargetTenant.phone, getNameByLang(whatsappTargetTenant, language), whatsappTargetTenant.rentAmount, currentMonth, currentYear, 'ur'), '_blank')
                  }
                  setWhatsappLangDialogOpen(false)
                }}
              >
                {t('sendUrdu', language)}
              </Button>
              <Button
                className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  if (whatsappTargetTenant) {
                    window.open(getWhatsAppLink(whatsappTargetTenant.whatsapp || whatsappTargetTenant.phone, getNameByLang(whatsappTargetTenant, language), whatsappTargetTenant.rentAmount, currentMonth, currentYear, 'hi'), '_blank')
                  }
                  setWhatsappLangDialogOpen(false)
                }}
              >
                {t('sendHindi', language)}
              </Button>
              <Button
                className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  if (whatsappTargetTenant) {
                    window.open(getWhatsAppLink(whatsappTargetTenant.whatsapp || whatsappTargetTenant.phone, getNameByLang(whatsappTargetTenant, language), whatsappTargetTenant.rentAmount, currentMonth, currentYear, 'bn'), '_blank')
                  }
                  setWhatsappLangDialogOpen(false)
                }}
              >
                {t('sendBengali', language)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Small helper component for profile fields ---------- */
function ProfileField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
