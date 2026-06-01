'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, cn2 } from '@/lib/utils'
import { t, getPropertyTypeLabel, getNameByLang, type Language } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Pencil, Trash2, Users, Loader2, Archive, ArchiveRestore } from 'lucide-react'

export default function Properties() {
  const { language, authUser } = useAppStore()
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyData | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    nameBn: '',
    nameUr: '',
    type: 'apartment',
    address: '',
    totalUnits: 1,
    floors: 1,
  })

  const canSeeRevenue = isOwnerOrAdmin(authUser?.role || '')

  const fetchProperties = useCallback(() => {
    try {
      const data = useDataStore.getState().getPropertiesWithTenants(showArchived)
      setProperties(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [showArchived])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', nameAr: '', nameBn: '', nameUr: '', type: 'apartment', address: '', totalUnits: 1, floors: 1 })
    setDialogOpen(true)
  }

  const openEdit = (p: PropertyData) => {
    setEditing(p)
    setForm({
      name: p.name,
      nameAr: p.nameAr || '',
      nameBn: p.nameBn || '',
      nameUr: p.nameUr || '',
      type: p.type,
      address: p.address || '',
      totalUnits: p.totalUnits,
      floors: p.floors || 1,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const body = { ...form, totalUnits: Number(form.totalUnits), floors: Number(form.floors) }
    if (editing) {
      useDataStore.getState().updateProperty(editing.id, body)
    } else {
      useDataStore.getState().addProperty(body)
    }
    setDialogOpen(false)
    fetchProperties()
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteProperty', language))) return
    useDataStore.getState().deleteProperty(id)
    fetchProperties()
  }

  const handleArchive = (id: string, archived: boolean) => {
    useDataStore.getState().archiveProperty(id, archived)
    fetchProperties()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('properties', language)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties.length} {t('propertiesManaged', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}
          >
            <Archive className="w-4 h-4 mr-1" />
            {t('archiveProperty', language)}
          </Button>
          <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t('addProperty', language)}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {properties.map((p) => {
          const activeTenants = (p.tenants || []).filter(t => t.status === 'active').length
          const occupancy = p.totalUnits > 0 ? Math.round((activeTenants / p.totalUnits) * 100) : 0
          const totalRent = (p.tenants || []).filter(t => t.status === 'active').reduce((s, t) => s + t.rentAmount, 0)

          return (
            <Card key={p.id} className={cn2('property-card-hover', p.archived && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {getNameByLang(p, language)}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {getPropertyTypeLabel(p.type, language)}
                        </Badge>
                        {p.archived && (
                          <Badge variant="outline" className="text-xs border-gray-400 text-gray-500">
                            {t('sellProperty', language)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleArchive(p.id, !p.archived)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title={p.archived ? t('archiveProperty', language) : t('archiveProperty', language)}>
                      {p.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
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
                    <p className="text-xs text-muted-foreground">{t('units', language)}</p>
                    <p className="font-bold text-sm">{p.totalUnits}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('tenantsCount', language)}</p>
                    <p className="font-bold text-sm">{activeTenants}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('occupancy', language)}</p>
                    <p className="font-bold text-sm">{occupancy}%</p>
                  </div>
                </div>

                {canSeeRevenue && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('monthlyRevenue', language)}</span>
                      <span className="font-semibold text-sm text-emerald">{formatAED(totalRent)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-emerald h-1.5 rounded-full transition-all"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editProperty', language) : t('addProperty', language)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('propertyName', language)}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Al Reef Al Junoobi - Building 1" />
            </div>
            <div>
              <Label>{t('nameArabic', language)}</Label>
              <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="المبنى أ" dir="rtl" />
            </div>
            <div>
              <Label>{t('nameBengali', language)}</Label>
              <Input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} placeholder="বিল্ডিং এ" />
            </div>
            <div>
              <Label>{t('nameUrdu', language)}</Label>
              <Input value={form.nameUr} onChange={e => setForm({ ...form, nameUr: e.target.value })} placeholder="بلڈنگ اے" dir="rtl" />
            </div>
            <div>
              <Label>{t('propertyType', language)}</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{t('apartment', language)}</SelectItem>
                  <SelectItem value="villa">{t('villa', language)}</SelectItem>
                  <SelectItem value="office">{t('office', language)}</SelectItem>
                  <SelectItem value="shop">{t('shop', language)}</SelectItem>
                  <SelectItem value="studio">{t('studio', language)}</SelectItem>
                  <SelectItem value="mixed_use">{t('mixedUse', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('address', language)}</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('totalUnitsCount', language)}</Label>
                <Input type="number" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>{t('floors', language)}</Label>
                <Input type="number" value={form.floors} onChange={e => setForm({ ...form, floors: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.name}>
              {t('save', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
