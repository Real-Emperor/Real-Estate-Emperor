'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PropertyData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, getPropertyTypeLabel } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react'

export default function Properties() {
  const { language } = useAppStore()
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyData | null>(null)
  const [form, setForm] = useState({ name: '', nameAr: '', type: 'apartment', address: '', totalUnits: 1 })

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', nameAr: '', type: 'apartment', address: '', totalUnits: 1 })
    setDialogOpen(true)
  }

  const openEdit = (p: PropertyData) => {
    setEditing(p)
    setForm({ name: p.name, nameAr: p.nameAr || '', type: p.type, address: p.address || '', totalUnits: p.totalUnits })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const body = { ...form, totalUnits: Number(form.totalUnits) }
    if (editing) {
      await fetch('/api/properties', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setDialogOpen(false)
    fetchProperties()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this property?', 'حذف هذا العقار؟'))) return
    await fetch(`/api/properties?id=${id}`, { method: 'DELETE' })
    fetchProperties()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('Properties', 'العقارات')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(`${properties.length} properties managed`, `${properties.length} عقارات مُدارة`)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('Add Property', 'إضافة عقار')}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {properties.map((p) => {
          const activeTenants = (p.tenants || []).filter(t => t.status === 'active').length
          const occupancy = p.totalUnits > 0 ? Math.round((activeTenants / p.totalUnits) * 100) : 0
          const totalRent = (p.tenants || []).filter(t => t.status === 'active').reduce((s, t) => s + t.rentAmount, 0)

          return (
            <Card key={p.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {language === 'ar' && p.nameAr ? p.nameAr : p.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {getPropertyTypeLabel(p.type, language)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {p.address && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">{p.address}</p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('Units', 'وحدات')}</p>
                    <p className="font-bold text-sm">{p.totalUnits}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('Tenants', 'مستأجرون')}</p>
                    <p className="font-bold text-sm">{activeTenants}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('Occupancy', 'إشغال')}</p>
                    <p className="font-bold text-sm">{occupancy}%</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('Monthly Revenue', 'الإيراد الشهري')}</span>
                    <span className="font-semibold text-sm text-emerald">{formatAED(totalRent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-emerald h-1.5 rounded-full transition-all"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit Property', 'تعديل العقار') : t('Add Property', 'إضافة عقار')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Property Name', 'اسم العقار')}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Building A" />
            </div>
            <div>
              <Label>{t('Arabic Name', 'الاسم بالعربية')}</Label>
              <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="المبنى أ" dir="rtl" />
            </div>
            <div>
              <Label>{t('Type', 'النوع')}</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{t('Apartment', 'شقة')}</SelectItem>
                  <SelectItem value="villa">{t('Villa', 'فيلا')}</SelectItem>
                  <SelectItem value="office">{t('Office', 'مكتب')}</SelectItem>
                  <SelectItem value="shop">{t('Shop', 'محل')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Address', 'العنوان')}</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>{t('Total Units', 'إجمالي الوحدات')}</Label>
              <Input type="number" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.name}>
              {t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
