'use client'

import { useEffect, useState, useCallback } from 'react'
import type { MaintenanceData, PropertyData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, formatDate, getPriorityColor, getMaintenanceStatusColor } from '@/lib/utils'
import { t, getNameByLang, getMaintenanceCategoryLabel, type Language } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Wrench, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react'

const MAINTENANCE_CATEGORIES = ['ac', 'plumbing', 'electrical', 'lock_door', 'painting', 'structural', 'other'] as const

export default function Maintenance() {
  const { language } = useAppStore()
  const lang = language as Language
  const [items, setItems] = useState<MaintenanceData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceData | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'pending',
    category: '', vendor: '', estimatedCost: 0, actualCost: 0, propertyId: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [mRes, pRes] = await Promise.all([fetch('/api/maintenance'), fetch('/api/properties')])
      if (mRes.ok) setItems(await mRes.json())
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
    setForm({ title: '', description: '', priority: 'medium', status: 'pending', category: '', vendor: '', estimatedCost: 0, actualCost: 0, propertyId: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: MaintenanceData) => {
    setEditing(item)
    setForm({
      title: item.title, description: item.description, priority: item.priority,
      status: item.status, category: item.category || '', vendor: item.vendor || '',
      estimatedCost: item.estimatedCost || 0, actualCost: item.actualCost || 0, propertyId: item.propertyId || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const body = {
      ...form,
      category: form.category || null,
      vendor: form.vendor || null,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
      actualCost: form.actualCost ? Number(form.actualCost) : null,
      propertyId: form.propertyId && form.propertyId !== 'none' ? form.propertyId : null,
    }
    if (editing) {
      await fetch('/api/maintenance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setDialogOpen(false)
    fetchData()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    await fetch('/api/maintenance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, title: item.title, description: item.description, priority: item.priority,
        status: newStatus, category: item.category, vendor: item.vendor,
        estimatedCost: item.estimatedCost, actualCost: item.actualCost, propertyId: item.propertyId,
      }),
    })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteTask', lang))) return
    await fetch(`/api/maintenance?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const columns = [
    { status: 'pending', label: t('pending', lang), color: 'border-t-amber-500' },
    { status: 'in-progress', label: t('inProgress', lang), color: 'border-t-blue-500' },
    { status: 'completed', label: t('completed', lang), color: 'border-t-emerald' },
  ]

  const priorityLabels: Record<string, string> = {
    urgent: t('urgent', lang),
    high: t('high', lang),
    medium: t('medium', lang),
    low: t('low', lang),
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('maintenance', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} {t('tasksCount', lang)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTask', lang)}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const columnItems = items.filter(i => i.status === col.status)
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">{columnItems.length}</Badge>
                </div>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {columnItems.map(item => (
                  <Card key={item.id} className={`card-hover border-t-4 ${col.color}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm flex-1">{item.title}</h4>
                        <div className="flex gap-1 shrink-0 ml-2">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(item.id, 'in-progress')}
                              className="p-1 rounded hover:bg-blue-50 text-blue-500"
                              title={t('start', lang)}
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.status === 'in-progress' && (
                            <button
                              onClick={() => updateStatus(item.id, 'completed')}
                              className="p-1 rounded hover:bg-emerald/10 text-emerald"
                              title={t('complete', lang)}
                            >
                              ✓
                            </button>
                          )}
                          <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-muted text-muted-foreground text-xs">✎</button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 text-red-400 text-xs">✕</button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {priorityLabels[item.priority] || item.priority}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {getMaintenanceCategoryLabel(item.category, lang)}
                          </Badge>
                        )}
                        {item.estimatedCost ? (
                          <span className="text-xs font-medium text-foreground">
                            {t('estimatedCost', lang).replace(' (AED)', '')}: {formatAED(item.estimatedCost)}
                          </span>
                        ) : null}
                        {item.actualCost ? (
                          <span className="text-xs font-medium text-terracotta">
                            {t('actualCost', lang).replace(' (AED)', '')}: {formatAED(item.actualCost)}
                          </span>
                        ) : null}
                        {item.vendor && (
                          <span className="text-xs text-muted-foreground">
                            {item.vendor}
                          </span>
                        )}
                        {item.propertyId && (() => {
                          const prop = properties.find(p => p.id === item.propertyId)
                          return prop ? <span className="text-xs text-muted-foreground">{getNameByLang(prop, lang)}</span> : null
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    {t('noTasks', lang)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editTask', lang) : t('addTask', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('title', lang)}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('category', lang)}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{getMaintenanceCategoryLabel(cat, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('vendor', lang)}</Label>
                <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={t('vendor', lang)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('priority', lang)}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('low', lang)}</SelectItem>
                    <SelectItem value="medium">{t('medium', lang)}</SelectItem>
                    <SelectItem value="high">{t('high', lang)}</SelectItem>
                    <SelectItem value="urgent">{t('urgent', lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('status', lang)}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('pending', lang)}</SelectItem>
                    <SelectItem value="in-progress">{t('inProgress', lang)}</SelectItem>
                    <SelectItem value="completed">{t('completed', lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('estimatedCost', lang)}</Label>
                <Input type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('actualCost', lang)}</Label>
                <Input type="number" value={form.actualCost} onChange={e => setForm({ ...form, actualCost: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>{t('property', lang)}</Label>
              <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder={t('selectProperty', lang)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none', lang)}</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.title}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
