'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ExpenseData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, getCategoryIcon } from '@/lib/utils'
import { t, getExpenseCategoryLabel, getNameByLang, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Receipt, Plus, Pencil, Trash2, TrendingDown, Loader2, ShieldAlert } from 'lucide-react'

const EXPENSE_CATEGORIES = ['maintenance', 'utility', 'insurance', 'manpower', 'municipality', 'leasing', 'security', 'other'] as const

export default function Expenses() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseData | null>(null)
  const [form, setForm] = useState({
    category: 'maintenance', description: '', amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: '', invoiceNumber: '', recurring: false, building: '',
  })

  // Access control: Owner/Admin only
  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const fetchExpenses = useCallback(() => {
    try {
      const store = useDataStore.getState()
      setExpenses(store.expenses)
      setProperties(store.getPropertiesWithTenants())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openNew = () => {
    setEditing(null)
    setForm({
      category: 'maintenance', description: '', amount: 0,
      date: new Date().toISOString().split('T')[0],
      vendor: '', invoiceNumber: '', recurring: false, building: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (e: ExpenseData) => {
    setEditing(e)
    setForm({
      category: e.category, description: e.description, amount: e.amount,
      date: new Date(e.date).toISOString().split('T')[0],
      vendor: e.vendor || '', invoiceNumber: e.invoiceNumber || '',
      recurring: e.recurring || false, building: e.building || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const store = useDataStore.getState()
    const body = {
      ...form,
      amount: Number(form.amount),
      vendor: form.vendor || null,
      invoiceNumber: form.invoiceNumber || null,
      recurring: form.recurring,
      building: form.building || null,
    }
    if (editing) {
      store.updateExpense(editing.id, body)
    } else {
      store.addExpense(body)
    }
    setDialogOpen(false)
    fetchExpenses()
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteExpense', lang))) return
    useDataStore.getState().deleteExpense(id)
    fetchExpenses()
  }

  const filtered = expenses.filter(e => categoryFilter === 'all' || e.category === categoryFilter)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthlyTotal = expenses
    .filter(e => { const d = new Date(e.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear })
    .reduce((s, e) => s + e.amount, 0)

  const categoryTotals: Record<string, number> = {}
  for (const e of expenses.filter(e => { const d = new Date(e.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear })) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ShieldAlert className="w-12 h-12 text-terracotta" />
        <h2 className="text-xl font-bold">{t('accessDenied', lang)}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('expenses', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {expenses.length} {t('expensesCount', lang)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addExpense', lang)}
        </Button>
      </div>

      {/* Monthly Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('thisMonthTotal', lang)}</p>
            <p className="text-2xl font-bold text-terracotta mt-1">{formatAED(monthlyTotal)}</p>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <Card key={cat} className="card-hover">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                {getCategoryIcon(cat)} {getExpenseCategoryLabel(cat, lang)}
              </p>
              <p className="text-xl font-bold mt-1">{formatAED(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
          className={categoryFilter === 'all' ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
        >
          {t('all', lang)}
        </Button>
        {EXPENSE_CATEGORIES.map(c => (
          <Button
            key={c}
            variant={categoryFilter === c ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(c)}
            className={categoryFilter === c ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {getCategoryIcon(c)} {getExpenseCategoryLabel(c, lang)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('category', lang)}</TableHead>
                  <TableHead>{t('description', lang)}</TableHead>
                  <TableHead>{t('amount', lang)}</TableHead>
                  <TableHead>{t('date', lang)}</TableHead>
                  <TableHead>{t('vendor', lang)}</TableHead>
                  <TableHead>{t('invoiceNumber', lang)}</TableHead>
                  <TableHead>{t('recurring', lang)}</TableHead>
                  <TableHead className="text-right">{t('actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryIcon(expense.category)} {getExpenseCategoryLabel(expense.category, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{expense.description}</TableCell>
                    <TableCell className="font-semibold text-sm text-terracotta">{formatAED(expense.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-sm">{expense.vendor || '—'}</TableCell>
                    <TableCell className="text-sm">{expense.invoiceNumber || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {expense.recurring ? (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t('recurring', lang)}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('oneTime', lang)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(expense)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('noExpensesFound', lang)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editExpense', lang) : t('addExpense', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('category', lang)}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{getCategoryIcon(cat)} {getExpenseCategoryLabel(cat, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('amount', lang)}</Label>
                <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('date', lang)}</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('vendor', lang)}</Label>
                <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={t('vendor', lang)} />
              </div>
              <div>
                <Label>{t('invoiceNumber', lang)}</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder={t('invoiceNumber', lang)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="recurring"
                  checked={form.recurring}
                  onCheckedChange={(checked) => setForm({ ...form, recurring: !!checked })}
                />
                <Label htmlFor="recurring" className="cursor-pointer">{t('recurring', lang)}</Label>
              </div>
              <div>
                <Label>{t('building', lang)}</Label>
                <Select value={form.building} onValueChange={v => setForm({ ...form, building: v })}>
                  <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none', lang)}</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={getNameByLang(p, lang)}>{getNameByLang(p, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.description || form.amount <= 0}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
