'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, getCategoryIcon } from '@/lib/utils'
import { t, getExpenseCategoryLabel, getNameByLang, type Language } from '@/lib/i18n'
import type { ExpenseData, PaymentData, TenantData, PropertyData } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

const PIE_COLORS = ['#0D7C3D', '#C4653A', '#C5A028', '#0A5C4E', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b']

interface DailyIncomeItem {
  tenantName: string
  propertyName: string
  unitNumber: string | null
  amount: number
  time: string
  method: string | null
}

interface DailyExpenseItem {
  id: string
  category: string
  description: string
  amount: number
  vendor: string | null
  time: string
}

export default function DailyExpensesReport() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [incomeItems, setIncomeItems] = useState<DailyIncomeItem[]>([])
  const [expenseItems, setExpenseItems] = useState<DailyExpenseItem[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  const barChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)

  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const computeDailyData = useCallback(() => {
    const { payments, tenants, properties, expenses } = useDataStore.getState()

    // Filter payments for the selected date
    const dayPayments = payments.filter(p => {
      const paymentDate = new Date(p.date).toISOString().split('T')[0]
      return paymentDate === selectedDate
    })

    // Build income items
    const income: DailyIncomeItem[] = dayPayments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenantId)
      const property = tenant ? properties.find(pr => pr.id === tenant.propertyId) : null
      return {
        tenantName: tenant ? getNameByLang(tenant, lang) : 'Unknown',
        propertyName: property?.name || '',
        unitNumber: tenant?.unitNumber || null,
        amount: p.amount,
        time: new Date(p.date).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
        method: p.method,
      }
    })

    // Filter expenses for the selected date
    const dayExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date).toISOString().split('T')[0]
      return expenseDate === selectedDate
    })

    // Build expense items
    const expenseList: DailyExpenseItem[] = dayExpenses.map(e => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      vendor: e.vendor,
      time: new Date(e.date).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
    }))

    const totalIn = income.reduce((sum, i) => sum + i.amount, 0)
    const totalExp = expenseList.reduce((sum, e) => sum + e.amount, 0)

    setIncomeItems(income)
    setExpenseItems(expenseList)
    setTotalIncome(totalIn)
    setTotalExpense(totalExp)
  }, [selectedDate, lang])

  useEffect(() => { computeDailyData() }, [computeDailyData])

  const netProfitLoss = totalIncome - totalExpense
  const expenseCategoryBreakdown: Record<string, number> = {}
  for (const e of expenseItems) {
    expenseCategoryBreakdown[e.category] = (expenseCategoryBreakdown[e.category] || 0) + e.amount
  }

  // Chart data
  const barChartData = [
    { name: t('income', lang), value: totalIncome, fill: '#0D7C3D' },
    { name: t('debits', lang), value: totalExpense, fill: '#C4653A' },
    { name: t('netProfitLoss', lang), value: Math.max(0, netProfitLoss), fill: '#0A5C4E' },
  ]

  const pieData = Object.entries(expenseCategoryBreakdown).map(([key, value]) => ({
    name: getExpenseCategoryLabel(key, lang),
    value,
  }))

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d <= tomorrow) {
      setSelectedDate(d.toISOString().split('T')[0])
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // PDF Export
  const handleExportPDF = useCallback(async () => {
    try {
      setExportingPDF(true)
      const { company } = useDataStore.getState()
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2

      // Page 1: Title
      pdf.setFillColor(13, 124, 61)
      pdf.rect(0, 0, pageWidth, 40, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.text('Al Reef Al Junoobi', margin, 16)
      pdf.setFontSize(10)
      pdf.text('Real Estate & General Maintenance L.L.C.', margin, 24)
      pdf.setFontSize(16)
      pdf.text(t('dailyExpensesReport', lang), pageWidth / 2, 35, { align: 'center' })

      pdf.setTextColor(0, 0, 0)
      let y = 50

      pdf.setFontSize(11)
      pdf.text(`${t('date', lang)}: ${formatDate(selectedDate + 'T00:00:00.000Z')}`, margin, y)
      pdf.text(`${t('generatedOn', lang)}: ${new Date().toLocaleDateString('en-AE')}`, margin + 80, y)
      y += 12

      // Summary box
      pdf.setFillColor(245, 245, 245)
      pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(13, 124, 61)
      pdf.text(t('dailySummary', lang), margin + 4, y + 7)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(9)
      pdf.text(`${t('totalIncome', lang)}: ${formatAED(totalIncome)}`, margin + 4, y + 14)
      pdf.text(`${t('totalExpense', lang)}: ${formatAED(totalExpense)}`, margin + 70, y + 14)
      pdf.text(`${t('netProfitLoss', lang)}: ${formatAED(netProfitLoss)}`, margin + 140, y + 14)
      const profitMargin = totalIncome > 0 ? ((netProfitLoss / totalIncome) * 100).toFixed(1) : '0'
      pdf.text(`Margin: ${profitMargin}%`, margin + 4, y + 22)
      y += 38

      // Income section
      pdf.setFontSize(11)
      pdf.setTextColor(13, 124, 61)
      pdf.text(`${t('income', lang)} (${t('rentCollected', lang)})`, margin, y)
      y += 6
      pdf.setFillColor(13, 124, 61)
      pdf.rect(margin, y, contentWidth, 7, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text(t('tenantName', lang), margin + 3, y + 5)
      pdf.text(t('property', lang), margin + 55, y + 5)
      pdf.text(t('unitNumber', lang), margin + 100, y + 5)
      pdf.text(t('amount', lang), margin + 125, y + 5)
      pdf.text(t('paymentTime', lang), margin + 155, y + 5)
      pdf.text(t('paymentMethod', lang), margin + 170, y + 5)
      y += 7
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)

      for (const item of incomeItems) {
        if (y > pageHeight - 20) { pdf.addPage(); y = 20 }
        pdf.text(item.tenantName.substring(0, 22), margin + 3, y + 4)
        pdf.text(item.propertyName.substring(0, 18), margin + 55, y + 4)
        pdf.text(item.unitNumber || '-', margin + 100, y + 4)
        pdf.text(formatAED(item.amount), margin + 125, y + 4)
        pdf.text(item.time, margin + 155, y + 4)
        pdf.text(item.method || '-', margin + 170, y + 4)
        y += 5
      }
      if (incomeItems.length === 0) {
        pdf.setTextColor(120, 120, 120)
        pdf.text(t('noTransactionsToday', lang), margin + 3, y + 4)
        y += 5
      }
      y += 8

      // Expense section
      pdf.setFontSize(11)
      pdf.setTextColor(196, 101, 58)
      pdf.text(t('debits', lang), margin, y)
      y += 6
      pdf.setFillColor(196, 101, 58)
      pdf.rect(margin, y, contentWidth, 7, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text(t('expenseCategory', lang), margin + 3, y + 5)
      pdf.text(t('description', lang), margin + 40, y + 5)
      pdf.text(t('amount', lang), margin + 125, y + 5)
      pdf.text(t('vendor', lang), margin + 155, y + 5)
      pdf.text(t('paymentTime', lang), margin + 175, y + 5)
      y += 7
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)

      for (const item of expenseItems) {
        if (y > pageHeight - 20) { pdf.addPage(); y = 20 }
        pdf.text(getExpenseCategoryLabel(item.category, lang), margin + 3, y + 4)
        pdf.text(item.description.substring(0, 30), margin + 40, y + 4)
        pdf.text(formatAED(item.amount), margin + 125, y + 4)
        pdf.text((item.vendor || '-').substring(0, 14), margin + 155, y + 4)
        pdf.text(item.time, margin + 175, y + 4)
        y += 5
      }
      if (expenseItems.length === 0) {
        pdf.setTextColor(120, 120, 120)
        pdf.text(t('noTransactionsToday', lang), margin + 3, y + 4)
        y += 5
      }

      // Page footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(7)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Al Reef Al Junoobi Real Estate | ${t('dailyExpensesReport', lang)} | ${formatDate(selectedDate + 'T00:00:00.000Z')} | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      }

      pdf.save(`Al_Reef_Daily_Report_${selectedDate}.pdf`)
      toast.success(t('exportSuccess', lang))
    } catch (error) {
      console.error('PDF Export failed:', error)
      toast.error(t('exportFailed', lang))
    } finally {
      setExportingPDF(false)
    }
  }, [selectedDate, lang, incomeItems, expenseItems, totalIncome, totalExpense, netProfitLoss])

  // XLSX Export
  const handleExportXLSX = useCallback(() => {
    try {
      setExporting(true)
      const { company } = useDataStore.getState()
      const wb = XLSX.utils.book_new()

      // Sheet 1: Daily Summary
      const summaryData = [
        [`${company.name} - ${t('dailyExpensesReport', lang)}`],
        [`${t('date', lang)}: ${selectedDate}`],
        [],
        [t('dailySummary', lang)],
        [t('totalIncome', lang), totalIncome],
        [t('totalExpense', lang), totalExpense],
        [t('netProfitLoss', lang), netProfitLoss],
        ['Margin %', totalIncome > 0 ? ((netProfitLoss / totalIncome) * 100).toFixed(1) + '%' : '0%'],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

      // Sheet 2: Income Details
      const incomeHeader = ['Tenant Name', 'Property', 'Unit', 'Amount (AED)', 'Time', 'Method']
      const incomeRows = incomeItems.map(i => [i.tenantName, i.propertyName, i.unitNumber || '', i.amount, i.time, i.method || ''])
      const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeader, ...incomeRows])
      wsIncome['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsIncome, 'Income')

      // Sheet 3: Expense Details
      const expenseHeader = ['Category', 'Description', 'Amount (AED)', 'Vendor', 'Time']
      const expenseRows = expenseItems.map(e => [getExpenseCategoryLabel(e.category, 'en'), e.description, e.amount, e.vendor || '', e.time])
      const wsExpense = XLSX.utils.aoa_to_sheet([expenseHeader, ...expenseRows])
      wsExpense['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 22 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsExpense, 'Expenses')

      XLSX.writeFile(wb, `Al_Reef_Daily_Report_${selectedDate}.xlsx`)
      toast.success(t('exportSuccess', lang))
    } catch (error) {
      console.error('XLSX Export failed:', error)
      toast.error(t('exportFailed', lang))
    } finally {
      setExporting(false)
    }
  }, [selectedDate, lang, incomeItems, expenseItems, totalIncome, totalExpense, netProfitLoss])

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ShieldAlert className="w-12 h-12 text-terracotta" />
        <h2 className="text-xl font-bold">{t('accessDenied', lang)}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', lang)}</p>
      </div>
    )
  }

  const formattedDate = formatDate(selectedDate + 'T00:00:00.000Z')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">{t('dailyExpensesReport', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportXLSX}
            disabled={exporting}
            className="bg-emerald hover:bg-emerald/90 text-white"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            {exporting ? t('loading', lang) : t('exportData', lang)}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-emerald hover:bg-emerald/90 text-white"
          >
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {exportingPDF ? t('loading', lang) : t('exportPDF', lang)}
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={prevDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald" />
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={nextDay}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday} className="border-emerald text-emerald">
          {t('today', lang)}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-emerald" />
              <p className="text-xs text-muted-foreground">{t('totalIncome', lang)}</p>
            </div>
            <p className="text-xl font-bold text-emerald">{formatAED(totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">{incomeItems.length} {t('tenantPayment', lang)}(s)</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-terracotta" />
              <p className="text-xs text-muted-foreground">{t('totalExpense', lang)}</p>
            </div>
            <p className="text-xl font-bold text-terracotta">{formatAED(totalExpense)}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenseItems.length} {t('expensesCount', lang)}</p>
          </CardContent>
        </Card>
        <Card className={`card-hover border-l-4 ${netProfitLoss >= 0 ? 'border-l-emerald' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${netProfitLoss >= 0 ? 'text-emerald' : 'text-red-500'}`} />
              <p className="text-xs text-muted-foreground">{t('netProfitLoss', lang)}</p>
            </div>
            <p className={`text-xl font-bold ${netProfitLoss >= 0 ? 'text-emerald' : 'text-red-600'}`}>
              {formatAED(netProfitLoss)}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-deep-teal" />
              <p className="text-xs text-muted-foreground">{t('profitOrLoss', lang)} %</p>
            </div>
            <p className={`text-xl font-bold ${netProfitLoss >= 0 ? 'text-emerald' : 'text-red-600'}`}>
              {totalIncome > 0 ? ((netProfitLoss / totalIncome) * 100).toFixed(1) : '0.0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card ref={barChartRef}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('incomeVsExpenses', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatAED(value)} contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Distribution Pie Chart */}
        <Card ref={pieChartRef}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('expenseDistribution', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAED(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {t('noExpensesFound', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald" />
            {t('income', lang)} — {t('rentCollected', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeItems.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {incomeItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.tenantName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.propertyName}</span>
                        <span className="text-xs text-muted-foreground">|</span>
                        <span className="text-xs text-muted-foreground">{t('unitNumber', lang)}: {item.unitNumber || '-'}</span>
                        {item.method && (
                          <>
                            <span className="text-xs text-muted-foreground">|</span>
                            <Badge variant="secondary" className="text-xs">{item.method}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald">{formatAED(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t('noTransactionsToday', lang)}</div>
          )}
        </CardContent>
      </Card>

      {/* Expense Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-terracotta" />
            {t('debits', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseItems.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expenseItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getExpenseCategoryLabel(item.category, lang)}
                        </Badge>
                        {item.vendor && <span className="text-xs text-muted-foreground">{item.vendor}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-terracotta">{formatAED(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t('noTransactionsToday', lang)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
