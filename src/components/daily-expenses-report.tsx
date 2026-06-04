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

// Category color mapping for consistent visual identity
const CATEGORY_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  manpower:   { bg: '#0D7C3D', text: '#FFFFFF', fill: '#0D7C3D' },
  salary:     { bg: '#0A5C4E', text: '#FFFFFF', fill: '#0A5C4E' },
  utility:    { bg: '#C5A028', text: '#FFFFFF', fill: '#C5A028' },
  utilities:  { bg: '#C5A028', text: '#FFFFFF', fill: '#C5A028' },
  maintenance:{ bg: '#C4653A', text: '#FFFFFF', fill: '#C4653A' },
  municipality:{ bg: '#8b5cf6', text: '#FFFFFF', fill: '#8b5cf6' },
  security:   { bg: '#06b6d4', text: '#FFFFFF', fill: '#06b6d4' },
  insurance:  { bg: '#f59e0b', text: '#FFFFFF', fill: '#f59e0b' },
  leasing:    { bg: '#ef4444', text: '#FFFFFF', fill: '#ef4444' },
  other:      { bg: '#6b7280', text: '#FFFFFF', fill: '#6b7280' },
}

interface DailyIncomeItem {
  tenantName: string
  propertyName: string
  unitNumber: string | null
  amount: number
  time: string
  method: string | null
  isLate: boolean
  notes: string | null
}

interface DailyExpenseItem {
  id: string
  category: string
  description: string
  amount: number
  vendor: string | null
  time: string
  recurring: boolean
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
        isLate: p.isLate || false,
        notes: p.notes || null,
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
      recurring: e.recurring || false,
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

  // ═══════════════════════════════════════════════════════════════════
  // PDF EXPORT — Professional, multi-page with charts and visual design
  // ═══════════════════════════════════════════════════════════════════
  const handleExportPDF = useCallback(async () => {
    try {
      setExportingPDF(true)
      const { company } = useDataStore.getState()
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()   // 210
      const ph = pdf.internal.pageSize.getHeight()   // 297
      const m = 14                                     // margin
      const cw = pw - m * 2                            // content width
      const profitMargin = totalIncome > 0 ? ((netProfitLoss / totalIncome) * 100).toFixed(1) : '0'
      const isProfit = netProfitLoss >= 0

      // ─── Helper: draw a rounded rect ───
      const drawRRect = (x: number, y: number, w: number, h: number, r: number, fillColor: string) => {
        pdf.setFillColor(fillColor)
        pdf.roundedRect(x, y, w, h, r, r, 'F')
      }

      // ─── Helper: draw horizontal line ───
      const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, thickness: number = 0.3) => {
        pdf.setDrawColor(color)
        pdf.setLineWidth(thickness)
        pdf.line(x1, y1, x2, y2)
      }

      // ─── Helper: check page break ───
      const checkPage = (y: number, needed: number): number => {
        if (y + needed > ph - 18) {
          pdf.addPage()
          return 18
        }
        return y
      }

      // ═════════════════════════════════════════════════════
      // PAGE 1: COVER + SUMMARY
      // ═════════════════════════════════════════════════════

      // Full-width header band
      pdf.setFillColor(13, 124, 61)
      pdf.rect(0, 0, pw, 52, 'F')

      // Accent stripe
      pdf.setFillColor(10, 92, 78)
      pdf.rect(0, 48, pw, 4, 'F')

      // Company name
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.text('Al Reef Al Madeena', m, 18)
      pdf.setFontSize(10)
      pdf.text('Real Estate Management and General Maintenance - L.L.C - S.P.C', m, 26)
      pdf.setFontSize(9)
      pdf.text("Near LuLu Muraba'a, Al Ain City, Abu Dhabi, UAE", m, 33)

      // Report title — right aligned
      pdf.setFontSize(18)
      pdf.text(t('dailyExpensesReport', lang), pw - m, 22, { align: 'right' })
      pdf.setFontSize(11)
      pdf.text(formatDate(selectedDate + 'T00:00:00.000Z'), pw - m, 32, { align: 'right' })
      pdf.setFontSize(8)
      pdf.text(`${t('generatedOn', lang)}: ${new Date().toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pw - m, 40, { align: 'right' })

      let y = 62

      // ─── KPI Cards Row ───
      const cardW = (cw - 9) / 4
      const cardH = 32

      // Card 1: Total Income
      drawRRect(m, y, cardW, cardH, 3, '#E8F5E9')
      pdf.setFillColor('#0D7C3D')
      pdf.rect(m, y, cardW, 3, 'F')
      pdf.setTextColor(13, 124, 61)
      pdf.setFontSize(8)
      pdf.text(t('totalIncome', lang), m + 4, y + 11)
      pdf.setFontSize(15)
      pdf.setTextColor(13, 124, 61)
      pdf.text(formatAED(totalIncome), m + 4, y + 22)
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${incomeItems.length} ${t('tenantPayment', lang)}(s)`, m + 4, y + 28)

      // Card 2: Total Expense
      const cx2 = m + cardW + 3
      drawRRect(cx2, y, cardW, cardH, 3, '#FBE9E7')
      pdf.setFillColor('#C4653A')
      pdf.rect(cx2, y, cardW, 3, 'F')
      pdf.setTextColor(196, 101, 58)
      pdf.setFontSize(8)
      pdf.text(t('totalExpense', lang), cx2 + 4, y + 11)
      pdf.setFontSize(15)
      pdf.setTextColor(196, 101, 58)
      pdf.text(formatAED(totalExpense), cx2 + 4, y + 22)
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${expenseItems.length} ${t('expensesCount', lang)}`, cx2 + 4, y + 28)

      // Card 3: Net P/L
      const cx3 = cx2 + cardW + 3
      drawRRect(cx3, y, cardW, cardH, 3, isProfit ? '#E8F5E9' : '#FFEBEE')
      pdf.setFillColor(isProfit ? '#0D7C3D' : '#D32F2F')
      pdf.rect(cx3, y, cardW, 3, 'F')
      pdf.setTextColor(isProfit ? 13 : 211, isProfit ? 124 : 47, isProfit ? 61 : 47)
      pdf.setFontSize(8)
      pdf.text(t('netProfitLoss', lang), cx3 + 4, y + 11)
      pdf.setFontSize(15)
      pdf.text(formatAED(netProfitLoss), cx3 + 4, y + 22)
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text(isProfit ? 'PROFIT' : 'LOSS', cx3 + 4, y + 28)

      // Card 4: Margin %
      const cx4 = cx3 + cardW + 3
      drawRRect(cx4, y, cardW, cardH, 3, '#E0F2F1')
      pdf.setFillColor('#0A5C4E')
      pdf.rect(cx4, y, cardW, 3, 'F')
      pdf.setTextColor(10, 92, 78)
      pdf.setFontSize(8)
      pdf.text(t('profitOrLoss', lang) + ' %', cx4 + 4, y + 11)
      pdf.setFontSize(15)
      pdf.setTextColor(isProfit ? 13 : 211, isProfit ? 124 : 47, isProfit ? 61 : 47)
      pdf.text(`${profitMargin}%`, cx4 + 4, y + 22)

      y += cardH + 10

      // ─── BAR CHART (captured from DOM) ───
      pdf.setTextColor(40, 40, 40)
      pdf.setFontSize(12)
      pdf.text(t('incomeVsExpenses', lang), m, y)
      y += 4

      if (barChartRef.current) {
        try {
          const canvas = await html2canvas(barChartRef.current, {
            scale: 2,
            backgroundColor: '#FFFFFF',
            logging: false,
            useCORS: true,
          })
          const imgData = canvas.toDataURL('image/png')
          const imgW = cw
          const imgH = 65
          pdf.addImage(imgData, 'PNG', m, y, imgW, imgH)
          y += imgH + 8
        } catch {
          // Fallback: simple text-based chart representation
          drawRRect(m, y, cw, 60, 3, '#F9FAFB')
          pdf.setTextColor(120, 120, 120)
          pdf.setFontSize(9)
          pdf.text('Bar Chart: Income vs Expenses', m + 4, y + 10)
          pdf.setFontSize(8)
          pdf.text(`${t('income', lang)}: ${formatAED(totalIncome)}`, m + 4, y + 20)
          pdf.text(`${t('debits', lang)}: ${formatAED(totalExpense)}`, m + 4, y + 28)
          pdf.text(`${t('netProfitLoss', lang)}: ${formatAED(netProfitLoss)}`, m + 4, y + 36)
          y += 68
        }
      } else {
        y += 68
      }

      // ─── PIE CHART (captured from DOM) ───
      y = checkPage(y, 80)
      pdf.setTextColor(40, 40, 40)
      pdf.setFontSize(12)
      pdf.text(t('expenseDistribution', lang), m, y)
      y += 4

      if (pieChartRef.current && pieData.length > 0) {
        try {
          const canvas = await html2canvas(pieChartRef.current, {
            scale: 2,
            backgroundColor: '#FFFFFF',
            logging: false,
            useCORS: true,
          })
          const imgData = canvas.toDataURL('image/png')
          const imgW = cw
          const imgH = 65
          pdf.addImage(imgData, 'PNG', m, y, imgW, imgH)
          y += imgH + 6
        } catch {
          y += 6
        }
      }

      // ─── Category Breakdown Table ───
      y = checkPage(y, 40 + Object.keys(expenseCategoryBreakdown).length * 7)
      pdf.setTextColor(40, 40, 40)
      pdf.setFontSize(11)
      pdf.text('Expense Category Breakdown', m, y)
      y += 5

      // Table header
      pdf.setFillColor(10, 92, 78)
      pdf.rect(m, y, cw, 7, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text('Category', m + 3, y + 5)
      pdf.text('Amount (AED)', m + 80, y + 5)
      pdf.text('% of Total', m + 130, y + 5)
      pdf.text('# Items', m + 160, y + 5)
      y += 7

      // Sort categories by amount desc
      const sortedCats = Object.entries(expenseCategoryBreakdown).sort((a, b) => b[1] - a[1])
      for (let i = 0; i < sortedCats.length; i++) {
        const [cat, amt] = sortedCats[i]
        const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0'
        const count = expenseItems.filter(e => e.category === cat).length
        const bgColor = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'

        y = checkPage(y, 7)
        pdf.setFillColor(bgColor)
        pdf.rect(m, y, cw, 7, 'F')

        // Category color dot
        const catColor = CATEGORY_COLORS[cat]?.fill || '#6b7280'
        pdf.setFillColor(catColor)
        pdf.circle(m + 4, y + 3.5, 2, 'F')

        pdf.setTextColor(40, 40, 40)
        pdf.setFontSize(8)
        pdf.text(getExpenseCategoryLabel(cat, lang), m + 10, y + 5)
        pdf.text(formatAED(amt), m + 80, y + 5)
        pdf.text(`${pct}%`, m + 130, y + 5)
        pdf.text(String(count), m + 160, y + 5)
        y += 7
      }

      // Category total row
      pdf.setFillColor('#F3F4F6')
      pdf.rect(m, y, cw, 7, 'F')
      pdf.setTextColor(40, 40, 40)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text('TOTAL', m + 10, y + 5)
      pdf.text(formatAED(totalExpense), m + 80, y + 5)
      pdf.text('100%', m + 130, y + 5)
      pdf.text(String(expenseItems.length), m + 160, y + 5)
      pdf.setFont('helvetica', 'normal')
      y += 12

      // ═════════════════════════════════════════════════════
      // PAGE 2+: DETAILED TRANSACTIONS
      // ═════════════════════════════════════════════════════
      pdf.addPage()
      y = 18

      // Mini header on detail pages
      pdf.setFillColor(13, 124, 61)
      pdf.rect(0, 0, pw, 14, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.text('Al Reef Al Madeena', m, 9)
      pdf.setFontSize(8)
      pdf.text(`${t('dailyExpensesReport', lang)} — ${formatDate(selectedDate + 'T00:00:00.000Z')}`, pw - m, 9, { align: 'right' })
      y = 22

      // ─── INCOME TABLE ───
      pdf.setTextColor(13, 124, 61)
      pdf.setFontSize(13)
      pdf.text(`${t('income', lang)} — ${t('rentCollected', lang)}`, m, y)

      // Income total badge
      pdf.setFillColor('#E8F5E9')
      const incomeBadgeW = 45
      drawRRect(pw - m - incomeBadgeW, y - 5, incomeBadgeW, 8, 2, '#E8F5E9')
      pdf.setTextColor(13, 124, 61)
      pdf.setFontSize(9)
      pdf.text(formatAED(totalIncome), pw - m - incomeBadgeW + 3, y)
      y += 6

      // Income table header
      pdf.setFillColor(13, 124, 61)
      pdf.rect(m, y, cw, 8, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7.5)
      pdf.text('#', m + 3, y + 5.5)
      pdf.text(t('tenantName', lang), m + 10, y + 5.5)
      pdf.text(t('property', lang), m + 52, y + 5.5)
      pdf.text(t('unitNumber', lang), m + 100, y + 5.5)
      pdf.text(t('amount', lang), m + 118, y + 5.5)
      pdf.text(t('paymentTime', lang), m + 147, y + 5.5)
      pdf.text(t('paymentMethod', lang), m + 162, y + 5.5)
      pdf.text('Status', m + 180, y + 5.5)
      y += 8

      // Income rows
      const sortedIncome = [...incomeItems].sort((a, b) => a.time.localeCompare(b.time))
      for (let i = 0; i < sortedIncome.length; i++) {
        y = checkPage(y, 7)
        const item = sortedIncome[i]
        const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
        pdf.setFillColor(rowBg)
        pdf.rect(m, y, cw, 7, 'F')

        // Status indicator
        if (item.isLate) {
          pdf.setFillColor('#FFEBEE')
          pdf.rect(m, y, cw, 7, 'F')
          // Red left border for late
          pdf.setFillColor('#D32F2F')
          pdf.rect(m, y, 1.5, 7, 'F')
        }

        pdf.setTextColor(item.isLate ? 180 : 40, item.isLate ? 40 : 40, item.isLate ? 40 : 40)
        pdf.setFontSize(7.5)
        pdf.text(String(i + 1), m + 3, y + 5)
        pdf.text(item.tenantName.substring(0, 20), m + 10, y + 5)
        pdf.text(item.propertyName.substring(0, 22), m + 52, y + 5)
        pdf.text(item.unitNumber || '-', m + 100, y + 5)
        pdf.setTextColor(13, 124, 61)
        pdf.text(formatAED(item.amount), m + 118, y + 5)
        pdf.setTextColor(item.isLate ? 180 : 40, item.isLate ? 40 : 40, item.isLate ? 40 : 40)
        pdf.text(item.time, m + 147, y + 5)
        pdf.text((item.method || '-').substring(0, 14), m + 162, y + 5)
        pdf.text(item.isLate ? 'LATE' : (item.notes?.includes('Partial') ? 'PARTIAL' : 'On Time'), m + 180, y + 5)
        y += 7
      }

      // Income total row
      y = checkPage(y, 8)
      pdf.setFillColor('#E8F5E9')
      pdf.rect(m, y, cw, 7, 'F')
      pdf.setTextColor(13, 124, 61)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`TOTAL INCOME: ${formatAED(totalIncome)}`, m + 10, y + 5)
      pdf.text(`${incomeItems.length} payments`, m + 147, y + 5)
      pdf.setFont('helvetica', 'normal')
      y += 14

      // ─── EXPENSE TABLE ───
      y = checkPage(y, 30)
      pdf.setTextColor(196, 101, 58)
      pdf.setFontSize(13)
      pdf.text(t('debits', lang), m, y)

      // Expense total badge
      drawRRect(pw - m - 45, y - 5, 45, 8, 2, '#FBE9E7')
      pdf.setTextColor(196, 101, 58)
      pdf.setFontSize(9)
      pdf.text(formatAED(totalExpense), pw - m - 42, y)
      y += 6

      // Expense table header
      pdf.setFillColor(196, 101, 58)
      pdf.rect(m, y, cw, 8, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7.5)
      pdf.text('#', m + 3, y + 5.5)
      pdf.text(t('expenseCategory', lang), m + 10, y + 5.5)
      pdf.text(t('description', lang), m + 42, y + 5.5)
      pdf.text(t('amount', lang), m + 118, y + 5.5)
      pdf.text(t('vendor', lang), m + 147, y + 5.5)
      pdf.text(t('paymentTime', lang), m + 175, y + 5.5)
      y += 8

      // Expense rows
      const sortedExpenses = [...expenseItems].sort((a, b) => a.time.localeCompare(b.time))
      for (let i = 0; i < sortedExpenses.length; i++) {
        y = checkPage(y, 7)
        const item = sortedExpenses[i]
        const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
        pdf.setFillColor(rowBg)
        pdf.rect(m, y, cw, 7, 'F')

        // Category color indicator (left border)
        const catColor = CATEGORY_COLORS[item.category]?.fill || '#6b7280'
        pdf.setFillColor(catColor)
        pdf.rect(m, y, 1.5, 7, 'F')

        pdf.setTextColor(40, 40, 40)
        pdf.setFontSize(7.5)
        pdf.text(String(i + 1), m + 3, y + 5)
        pdf.text(getExpenseCategoryLabel(item.category, lang), m + 10, y + 5)
        pdf.text(item.description.substring(0, 32), m + 42, y + 5)
        pdf.setTextColor(196, 101, 58)
        pdf.text(formatAED(item.amount), m + 118, y + 5)
        pdf.setTextColor(40, 40, 40)
        pdf.text((item.vendor || '-').substring(0, 12), m + 147, y + 5)
        pdf.text(item.time, m + 175, y + 5)
        y += 7
      }

      // Expense total row
      y = checkPage(y, 8)
      pdf.setFillColor('#FBE9E7')
      pdf.rect(m, y, cw, 7, 'F')
      pdf.setTextColor(196, 101, 58)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`TOTAL EXPENSES: ${formatAED(totalExpense)}`, m + 10, y + 5)
      pdf.text(`${expenseItems.length} items`, m + 147, y + 5)
      pdf.setFont('helvetica', 'normal')
      y += 14

      // ─── NET SUMMARY BOX ───
      y = checkPage(y, 28)
      const summaryBg = isProfit ? '#E8F5E9' : '#FFEBEE'
      const summaryBorder = isProfit ? '#0D7C3D' : '#D32F2F'
      drawRRect(m, y, cw, 24, 4, summaryBg)
      pdf.setFillColor(summaryBorder)
      pdf.rect(m, y, cw, 3, 'F')

      pdf.setTextColor(isProfit ? 13 : 211, isProfit ? 124 : 47, isProfit ? 61 : 47)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text(isProfit ? 'NET PROFIT' : 'NET LOSS', m + 6, y + 12)
      pdf.setFontSize(18)
      pdf.text(formatAED(Math.abs(netProfitLoss)), m + 6, y + 21)

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Margin: ${profitMargin}%`, m + 90, y + 12)
      pdf.text(`Income: ${formatAED(totalIncome)}`, m + 90, y + 19)
      pdf.text(`Expenses: ${formatAED(totalExpense)}`, m + 90, y + 25)

      // ─── Page footers on all pages ───
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        drawLine(m, ph - 12, pw - m, ph - 12, '#E5E7EB', 0.3)
        pdf.setFontSize(6.5)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Al Reef Al Madeena Real Estate Management and General Maintenance - L.L.C - S.P.C | ${t('dailyExpensesReport', lang)} | ${formatDate(selectedDate + 'T00:00:00.000Z')}`, m, ph - 7)
        pdf.text(`Page ${i} of ${totalPages}`, pw - m, ph - 7, { align: 'right' })
        pdf.text('CONFIDENTIAL', pw / 2, ph - 7, { align: 'center' })
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

  // ═══════════════════════════════════════════════════════════════════
  // XLSX EXPORT — Professional multi-sheet with formatting
  // ═══════════════════════════════════════════════════════════════════
  const handleExportXLSX = useCallback(() => {
    try {
      setExporting(true)
      const { company } = useDataStore.getState()
      const wb = XLSX.utils.book_new()
      const profitMargin = totalIncome > 0 ? ((netProfitLoss / totalIncome) * 100).toFixed(1) : '0'
      const isProfit = netProfitLoss >= 0

      // ─── SHEET 1: EXECUTIVE SUMMARY ───
      const summaryRows: any[][] = [
        // Row 1: Company name (merged visually)
        [company.name || 'Al Reef Al Madeena Real Estate Management and General Maintenance - L.L.C - S.P.C'],
        // Row 2: Report title
        [t('dailyExpensesReport', lang).toUpperCase()],
        // Row 3: Date
        [`${t('date', lang)}: ${formatDate(selectedDate + 'T00:00:00.000Z')}`, '', '', `${t('generatedOn', lang)}: ${new Date().toLocaleDateString('en-AE')}`],
        // Row 4: blank
        [],
        // Row 5: Section header
        ['FINANCIAL SUMMARY', '', '', ''],
        // Row 6: Headers
        ['Metric', 'Amount (AED)', '% of Income', 'Count'],
        // Row 7-9: Data
        [t('totalIncome', lang), totalIncome, '100%', incomeItems.length],
        [t('totalExpense', lang), totalExpense, totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}%` : 'N/A', expenseItems.length],
        [t('netProfitLoss', lang), netProfitLoss, `${profitMargin}%`, ''],
        // Row 10: blank
        [],
        // Row 11: Section header
        ['PAYMENT METHOD BREAKDOWN', '', '', ''],
        // Row 12: Headers
        ['Method', 'Amount (AED)', '# Payments', 'Avg Payment'],
      ]

      // Payment method breakdown
      const methodBreakdown: Record<string, { total: number; count: number }> = {}
      for (const p of incomeItems) {
        const method = p.method || 'Unknown'
        if (!methodBreakdown[method]) methodBreakdown[method] = { total: 0, count: 0 }
        methodBreakdown[method].total += p.amount
        methodBreakdown[method].count++
      }
      for (const [method, data] of Object.entries(methodBreakdown)) {
        summaryRows.push([
          method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
          data.total,
          data.count,
          data.count > 0 ? Math.round(data.total / data.count) : 0,
        ])
      }

      // Late payment stats
      const latePayments = incomeItems.filter(p => p.isLate)
      const partialPayments = incomeItems.filter(p => p.notes?.includes('Partial'))
      summaryRows.push([])
      summaryRows.push(['PAYMENT STATUS ANALYSIS', '', '', ''])
      summaryRows.push(['Status', 'Amount (AED)', '# Payments', ''])
      summaryRows.push(['On-time', incomeItems.filter(p => !p.isLate).reduce((s, p) => s + p.amount, 0), incomeItems.filter(p => !p.isLate).length, ''])
      summaryRows.push(['Late', latePayments.reduce((s, p) => s + p.amount, 0), latePayments.length, ''])
      summaryRows.push(['Partial', partialPayments.reduce((s, p) => s + p.amount, 0), partialPayments.length, ''])

      // Income by property
      const propertyBreakdown: Record<string, { total: number; count: number }> = {}
      for (const p of incomeItems) {
        if (!propertyBreakdown[p.propertyName]) propertyBreakdown[p.propertyName] = { total: 0, count: 0 }
        propertyBreakdown[p.propertyName].total += p.amount
        propertyBreakdown[p.propertyName].count++
      }
      summaryRows.push([])
      summaryRows.push(['INCOME BY PROPERTY', '', '', ''])
      summaryRows.push(['Property', 'Amount (AED)', '# Payments', 'Avg Rent'])
      for (const [prop, data] of Object.entries(propertyBreakdown).sort((a, b) => b[1].total - a[1].total)) {
        summaryRows.push([prop, data.total, data.count, data.count > 0 ? Math.round(data.total / data.count) : 0])
      }

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      wsSummary['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 15 }, { wch: 14 }]
      // Merge company name across columns
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      ]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary')

      // ─── SHEET 2: INCOME DETAILS ───
      const incomeHeader = ['#', 'Tenant Name', 'Property', 'Unit', 'Amount (AED)', 'Time', 'Method', 'Status', 'Notes']
      const incomeRows = [...incomeItems]
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((item, idx) => [
          idx + 1,
          item.tenantName,
          item.propertyName,
          item.unitNumber || '',
          item.amount,
          item.time,
          item.method || '',
          item.isLate ? 'LATE' : (item.notes?.includes('Partial') ? 'PARTIAL' : 'On Time'),
          item.notes || '',
        ])

      // Add totals row
      incomeRows.push([])
      incomeRows.push(['', 'TOTAL', '', '', totalIncome, '', '', `${incomeItems.length} payments`, ''])

      const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeader, ...incomeRows])
      wsIncome['!cols'] = [
        { wch: 4 }, { wch: 22 }, { wch: 28 }, { wch: 8 },
        { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 25 },
      ]
      XLSX.utils.book_append_sheet(wb, wsIncome, 'Income Details')

      // ─── SHEET 3: EXPENSE DETAILS ───
      const expenseHeader = ['#', 'Category', 'Description', 'Amount (AED)', 'Vendor', 'Time', 'Recurring', '% of Total']
      const expenseRows = [...expenseItems]
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((item, idx) => [
          idx + 1,
          getExpenseCategoryLabel(item.category, 'en'),
          item.description,
          item.amount,
          item.vendor || '',
          item.time,
          item.recurring ? 'Yes' : 'No',
          totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) + '%' : '0%',
        ])

      // Add totals row
      expenseRows.push([])
      expenseRows.push(['', 'TOTAL', '', totalExpense, '', '', '', '100%'])

      const wsExpense = XLSX.utils.aoa_to_sheet([expenseHeader, ...expenseRows])
      wsExpense['!cols'] = [
        { wch: 4 }, { wch: 16 }, { wch: 36 }, { wch: 14 },
        { wch: 22 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
      ]
      XLSX.utils.book_append_sheet(wb, wsExpense, 'Expense Details')

      // ─── SHEET 4: CATEGORY ANALYSIS ───
      const catHeader = ['Category', 'Amount (AED)', '% of Total Expenses', '# Items', 'Avg per Item']
      const catRows = Object.entries(expenseCategoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => {
          const count = expenseItems.filter(e => e.category === cat).length
          return [
            getExpenseCategoryLabel(cat, 'en'),
            amt,
            totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) + '%' : '0%',
            count,
            count > 0 ? Math.round(amt / count) : 0,
          ]
        })
      catRows.push([])
      catRows.push(['TOTAL', totalExpense, '100%', expenseItems.length, ''])

      const wsCat = XLSX.utils.aoa_to_sheet([catHeader, ...catRows])
      wsCat['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 10 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsCat, 'Category Analysis')

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
                <div key={idx} className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 ${item.isLate ? 'border-l-3 border-l-red-400 bg-red-50/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.isLate ? 'bg-red-100 text-red-600' : 'bg-emerald/10 text-emerald'} flex items-center justify-center text-xs font-bold`}>
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
                        {item.isLate && (
                          <Badge variant="destructive" className="text-xs">LATE</Badge>
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
