'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ExpenseData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatAED, formatDate, getCategoryIcon } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Receipt, Plus, Pencil, Trash2, TrendingDown, Loader2 } from 'lucide-react'

export default function Expenses() {
  const { language } = useAppStore()
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseData | null>(null)
  const [form, setForm] = useState({ category: 'maintenance', description: '', amount: 0, date: new Date().toISOString().split('T')[0] })

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses')
      if (res.ok) setExpenses(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openNew = () => {
    setEditing(null)
    setForm({ category: 'maintenance', description: '', amount: 0, date: new Date().toISOString().split('T')[0] })
    setDialogOpen(true)
  }

  const openEdit = (e: ExpenseData) => {
    setEditing(e)
    setForm({ category: e.category, description: e.description, amount: e.amount, date: new Date(e.date).toISOString().split('T')[0] })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const body = { ...form, amount: Number(form.amount) }
    if (editing) {
      await fetch('/api/expenses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setDialogOpen(false)
    fetchExpenses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this expense?', 'حذف هذا المصروف؟'))) return
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('Expenses', 'المصروفات')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(`${expenses.length} expenses tracked`, `${expenses.length} مصروفات مسجلة`)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('Add Expense', 'إضافة مصروف')}
        </Button>
      </div>

      {/* Monthly Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('This Month Total', 'إجمالي الشهر')}</p>
            <p className="text-2xl font-bold text-terracotta mt-1">{formatAED(monthlyTotal)}</p>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <Card key={cat} className="card-hover">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                {getCategoryIcon(cat)} {t(cat.charAt(0).toUpperCase() + cat.slice(1), cat === 'utility' ? 'مرافق' : cat === 'maintenance' ? 'صيانة' : cat === 'insurance' ? 'تأمين' : cat === 'salary' ? 'رواتب' : 'أخرى')}
              </p>
              <p className="text-xl font-bold mt-1">{formatAED(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'utility', 'maintenance', 'insurance', 'salary', 'other'].map(c => (
          <Button
            key={c}
            variant={categoryFilter === c ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(c)}
            className={categoryFilter === c ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {c === 'all' ? t('All', 'الكل') : `${getCategoryIcon(c)} ${t(c.charAt(0).toUpperCase() + c.slice(1), c)}`}
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
                  <TableHead>{t('Category', 'الفئة')}</TableHead>
                  <TableHead>{t('Description', 'الوصف')}</TableHead>
                  <TableHead>{t('Amount', 'المبلغ')}</TableHead>
                  <TableHead>{t('Date', 'التاريخ')}</TableHead>
                  <TableHead className="text-right">{t('Actions', 'إجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryIcon(expense.category)} {t(expense.category.charAt(0).toUpperCase() + expense.category.slice(1), expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{expense.description}</TableCell>
                    <TableCell className="font-semibold text-sm text-terracotta">{formatAED(expense.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.date)}</TableCell>
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
              {t('No expenses found', 'لم يتم العثور على مصروفات')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit Expense', 'تعديل المصروف') : t('Add Expense', 'إضافة مصروف')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Category', 'الفئة')}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">{getCategoryIcon('maintenance')} {t('Maintenance', 'صيانة')}</SelectItem>
                  <SelectItem value="utility">{getCategoryIcon('utility')} {t('Utility', 'مرافق')}</SelectItem>
                  <SelectItem value="insurance">{getCategoryIcon('insurance')} {t('Insurance', 'تأمين')}</SelectItem>
                  <SelectItem value="salary">{getCategoryIcon('salary')} {t('Salary', 'رواتب')}</SelectItem>
                  <SelectItem value="other">{getCategoryIcon('other')} {t('Other', 'أخرى')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Description', 'الوصف')}</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>{t('Amount (AED)', 'المبلغ (درهم)')}</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('Date', 'التاريخ')}</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.description || form.amount <= 0}>
              {t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
