'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { ReportData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, getCategoryIcon } from '@/lib/utils'
import { t, getMonthName, getExpenseCategoryLabel, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  BarChart3,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  FileSpreadsheet,
  FileText,
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
  Area,
  AreaChart,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

const PIE_COLORS = ['#0D7C3D', '#C5A028', '#0A5C4E', '#C4653A', '#8b5cf6', '#ef4444', '#06b6d4']

function getTenantScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Warning'
  return 'Poor'
}

function getUnitTypeLabel(type: string | null): string {
  switch (type) {
    case 'studio': return 'Studio'
    case '1bedroom': return '1 Bedroom'
    case '2bedroom': return '2 Bedroom'
    case '3bedroom': return '3 Bedroom'
    case 'shop': return 'Shop'
    case 'office': return 'Office'
    default: return type || ''
  }
}

function getPropertyTypeLabel(type: string): string {
  switch (type) {
    case 'apartment': return 'Apartment'
    case 'villa': return 'Villa'
    case 'office': return 'Office'
    case 'shop': return 'Shop'
    case 'studio': return 'Studio'
    case 'mixed_use': return 'Mixed Use'
    default: return type
  }
}

function getMaintenanceCategoryLabelExport(category: string | null): string {
  switch (category) {
    case 'ac': return 'AC'
    case 'plumbing': return 'Plumbing'
    case 'electrical': return 'Electrical'
    case 'lock_door': return 'Lock/Door'
    case 'painting': return 'Painting'
    case 'structural': return 'Structural'
    default: return category || 'Other'
  }
}

function getExpenseCategoryLabelExport(category: string): string {
  switch (category) {
    case 'maintenance': return 'Maintenance'
    case 'utility': case 'utilities': return 'Utilities'
    case 'insurance': return 'Insurance'
    case 'manpower': return 'Manpower/Staff'
    case 'municipality': return 'Municipality Fees'
    case 'leasing': return 'Leasing Commission'
    case 'security': return 'Security'
    default: return 'Other'
  }
}

export default function Reports() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Refs for chart sections to capture for PDF
  const barChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)
  const areaChartRef = useRef<HTMLDivElement>(null)

  // Access control: Owner/Admin only
  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const fetchData = useCallback(() => {
    try {
      const reportData = useDataStore.getState().getReportData(selectedMonth, selectedYear)
      if (reportData) setData(reportData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = useCallback(async () => {
    if (!data) return
    try {
      setExportingPDF(true)
      const store = useDataStore.getState()
      const { company } = store
      const monthName = getMonthName(selectedMonth, 'en')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2

      // ── Page 1: Title Page ──
      pdf.setFillColor(13, 124, 61) // #0D7C3D
      pdf.rect(0, 0, pageWidth, 50, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.text('Al Reef Al Junoobi', pageWidth / 2, 20, { align: 'center' })
      pdf.setFontSize(12)
      pdf.text('Real Estate & General Maintenance L.L.C.', pageWidth / 2, 30, { align: 'center' })
      pdf.setFontSize(16)
      pdf.text(`${t('financialSummary', lang)} - ${monthName} ${selectedYear}`, pageWidth / 2, 42, { align: 'center' })

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.text(`${t('generatedOn', lang)}: ${new Date().toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 65)
      pdf.text(`Report Period: ${monthName} ${selectedYear}`, margin, 72)

      // Key metrics box
      let y = 85
      pdf.setFillColor(245, 245, 245)
      pdf.roundedRect(margin, y, contentWidth, 65, 3, 3, 'F')
      pdf.setFontSize(12)
      pdf.setTextColor(13, 124, 61)
      pdf.text(t('financialSummary', lang), margin + 5, y + 10)
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)

      const metrics = [
        [t('revenue', lang), formatAED(data.totalRevenue)],
        [t('expenses', lang), formatAED(data.totalExpenses)],
        [t('profitOrLoss', lang), formatAED(data.profitLoss)],
        [t('collectionRate', lang), `${data.collectionRate}%`],
        [t('occupancyRate', lang), `${data.occupancyRate}%`],
        [t('grossRevenue', lang), formatAED(data.grossRevenue)],
        [t('netIncome', lang), formatAED(data.netIncome)],
      ]
      metrics.forEach(([label, value], idx) => {
        const rowY = y + 18 + idx * 7
        pdf.text(label, margin + 8, rowY)
        pdf.text(value, margin + contentWidth - 8, rowY, { align: 'right' })
      })

      // ── Page 2: Charts ──
      // Capture bar chart
      if (barChartRef.current) {
        try {
          const canvas = await html2canvas(barChartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false })
          const imgData = canvas.toDataURL('image/png')
          pdf.addPage()
          pdf.setFillColor(13, 124, 61)
          pdf.rect(0, 0, pageWidth, 15, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(12)
          pdf.text(`${t('sixMonthTrend', lang)} - ${monthName} ${selectedYear}`, pageWidth / 2, 10, { align: 'center' })
          pdf.setTextColor(0, 0, 0)
          const imgW = contentWidth
          const imgH = (canvas.height / canvas.width) * imgW
          pdf.addImage(imgData, 'PNG', margin, 20, imgW, Math.min(imgH, 120))
        } catch { /* skip chart if capture fails */ }
      }

      // Capture pie chart
      if (pieChartRef.current) {
        try {
          const canvas = await html2canvas(pieChartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false })
          const imgData = canvas.toDataURL('image/png')
          const imgW = contentWidth * 0.8
          const imgH = (canvas.height / canvas.width) * imgW
          const currentY = pdf.internal.pageSize.getHeight() - 20 > (pdf as any).lastY ? 140 : 20
          pdf.addImage(imgData, 'PNG', margin + contentWidth * 0.1, currentY, imgW, Math.min(imgH, 100))
        } catch { /* skip chart if capture fails */ }
      }

      // ── Page 3: Revenue Analysis Chart ──
      if (areaChartRef.current) {
        try {
          const canvas = await html2canvas(areaChartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false })
          const imgData = canvas.toDataURL('image/png')
          pdf.addPage()
          pdf.setFillColor(13, 124, 61)
          pdf.rect(0, 0, pageWidth, 15, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(12)
          pdf.text(`${t('revenueAnalysis', lang)} - ${monthName} ${selectedYear}`, pageWidth / 2, 10, { align: 'center' })
          pdf.setTextColor(0, 0, 0)
          const imgW = contentWidth
          const imgH = (canvas.height / canvas.width) * imgW
          pdf.addImage(imgData, 'PNG', margin, 20, imgW, Math.min(imgH, 140))
        } catch { /* skip chart if capture fails */ }
      }

      // ── P&L Statement ──
      let plY = 170
      pdf.setFontSize(12)
      pdf.setTextColor(13, 124, 61)
      pdf.text(t('profitAndLoss', lang), margin, plY)
      plY += 8
      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)

      const plItems = [
        [t('rentalIncome', lang), formatAED(data.rentalIncome), ''],
        [t('otherIncome', lang), formatAED(data.otherIncome), ''],
        [t('grossRevenue', lang), formatAED(data.grossRevenue), 'bold'],
        [t('vacancyLoss', lang), `-${formatAED(data.vacancyLoss)}`, 'red'],
        [t('badDebt', lang), `-${formatAED(data.badDebt)}`, 'red'],
        [t('grossProfit', lang), formatAED(data.grossProfit), data.grossProfit >= 0 ? 'green' : 'red'],
        [t('operatingExpenses', lang), `-${formatAED(data.costOfOperations)}`, 'red'],
        [t('netIncome', lang), formatAED(data.netIncome), data.netIncome >= 0 ? 'green' : 'red'],
      ]
      plItems.forEach(([label, value, style]) => {
        if (plY > pageHeight - 20) { pdf.addPage(); plY = 20 }
        if (style === 'bold') pdf.setFont('helvetica', 'bold')
        else pdf.setFont('helvetica', 'normal')
        pdf.text(label, margin, plY)
        pdf.text(value, margin + contentWidth, plY, { align: 'right' })
        plY += 6
      })

      // Expense breakdown table
      if (plY > pageHeight - 60) { pdf.addPage(); plY = 20 }
      plY += 5
      pdf.setFontSize(11)
      pdf.setTextColor(13, 124, 61)
      pdf.text(t('expenseBreakdown', lang), margin, plY)
      plY += 7
      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      pdf.text(t('expenseCategory', lang), margin, plY)
      pdf.text(t('amount', lang), margin + contentWidth, plY, { align: 'right' })
      plY += 2
      pdf.line(margin, plY, margin + contentWidth, plY)
      plY += 4
      pdf.setFont('helvetica', 'normal')
      Object.entries(data.expenseBreakdown).forEach(([key, value]) => {
        if (plY > pageHeight - 20) { pdf.addPage(); plY = 20 }
        pdf.text(getExpenseCategoryLabelExport(key), margin, plY)
        pdf.text(formatAED(value), margin + contentWidth, plY, { align: 'right' })
        plY += 5
      })

      // Footer on all pages
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(7)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Al Reef Al Junoobi Real Estate | ${monthName} ${selectedYear} Report | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      }

      pdf.save(`Al_Reef_Report_${monthName}_${selectedYear}.pdf`)
      toast.success(t('exportSuccess', lang))
    } catch (error) {
      console.error('PDF Export failed:', error)
      toast.error(t('exportFailed', lang))
    } finally {
      setExportingPDF(false)
    }
  }, [selectedMonth, selectedYear, lang, data])

  const handleExportXLSX = useCallback(() => {
    try {
      setExporting(true)
      const store = useDataStore.getState()
      const { properties, tenants, payments, expenses, maintenanceItems, company } = store
      const reportData = store.getReportData(selectedMonth, selectedYear)

      const wb = XLSX.utils.book_new()

      // ── Sheet 1: Financial Summary ──
      const summaryData = [
        [`${company.name} - Financial Report`],
        [`${getMonthName(selectedMonth, 'en')} ${selectedYear}`],
        [],
        ['FINANCIAL SUMMARY', '', '', ''],
        ['Metric', 'Value (AED)', '', ''],
        ['Expected Revenue', reportData.expectedRevenue],
        ['Collected Revenue', reportData.totalRevenue],
        ['Total Expenses', reportData.totalExpenses],
        ['Profit / Loss', reportData.profitLoss],
        [],
        ['PROFIT & LOSS STATEMENT', '', '', ''],
        ['Rental Income', reportData.rentalIncome],
        ['Other Income', reportData.otherIncome],
        ['Gross Revenue', reportData.grossRevenue],
        ['Vacancy Loss', `-${reportData.vacancyLoss}`],
        ['Bad Debt / Unpaid', `-${reportData.badDebt}`],
        ['Gross Profit', reportData.grossProfit],
        ['Operating Expenses', `-${reportData.costOfOperations}`],
        ['Net Income', reportData.netIncome],
        [],
        ['KEY METRICS', '', '', ''],
        ['Collection Rate', `${reportData.collectionRate}%`],
        ['Occupancy Rate', `${reportData.occupancyRate}%`],
        ['Total Units', reportData.totalUnits],
        ['Occupied Units', reportData.occupiedUnits],
        ['Net Profit Margin', `${reportData.grossRevenue > 0 ? ((reportData.netIncome / reportData.grossRevenue) * 100).toFixed(1) : 0}%`],
        [],
        ['6-MONTH TREND', '', '', ''],
        ['Month', 'Revenue (AED)', 'Expenses (AED)', 'Profit (AED)'],
        ...reportData.trend.map(item => [
          `${getMonthName(item.month, 'en')} ${item.year}`,
          item.revenue,
          item.expenses,
          item.profit,
        ]),
        [],
        ['EXPENSE BREAKDOWN', '', '', ''],
        ['Category', 'Amount (AED)'],
        ...Object.entries(reportData.expenseBreakdown).map(([key, value]) => [
          getExpenseCategoryLabelExport(key),
          value,
        ]),
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary')

      // ── Sheet 2: Properties ──
      const propertiesHeader = [
        'Property Name', 'Name (Arabic)', 'Type', 'Address', 'Total Units',
        'Floors', 'Active Tenants', 'Occupancy %', 'Monthly Revenue (AED)', 'Status',
      ]
      const propertiesRows = properties.map(p => {
        const activeTenants = tenants.filter(t => t.propertyId === p.id && t.status === 'active')
        const occupancy = p.totalUnits > 0 ? Math.round((activeTenants.length / p.totalUnits) * 100) : 0
        const monthlyRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)
        return [
          p.name,
          p.nameAr || '',
          getPropertyTypeLabel(p.type),
          p.address || '',
          p.totalUnits,
          p.floors,
          activeTenants.length,
          `${occupancy}%`,
          monthlyRevenue,
          p.archived ? 'Archived' : 'Active',
        ]
      })
      const wsProperties = XLSX.utils.aoa_to_sheet([propertiesHeader, ...propertiesRows])
      wsProperties['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsProperties, 'Properties')

      // ── Sheet 3: Tenants ──
      const tenantsHeader = [
        'Tenant Name', 'Name (Arabic)', 'Property', 'Unit Number', 'Unit Type',
        'Floor', 'Size (sqft)', 'Nationality', 'Phone', 'WhatsApp',
        'Emirates ID', 'Employer', 'Monthly Rent (AED)', 'Municipality Fee (AED)',
        'Security Deposit (AED)', 'Payment Method', 'Lease Start', 'Lease End',
        'Contract Duration (months)', 'Status', 'Tenant Score', 'Late Payments',
      ]
      const tenantsRows = tenants.map(tn => {
        const prop = properties.find(p => p.id === tn.propertyId)
        return [
          tn.name,
          tn.nameAr || '',
          prop?.name || '',
          tn.unitNumber || '',
          getUnitTypeLabel(tn.unitType),
          tn.floor || '',
          tn.sizeSqft || '',
          tn.nationality || '',
          tn.phone,
          tn.whatsapp || '',
          tn.emiratesId || '',
          tn.employer || '',
          tn.rentAmount,
          tn.municipalityFee || '',
          tn.securityDeposit || '',
          tn.paymentMethod || '',
          tn.leaseStart ? formatDate(tn.leaseStart) : '',
          tn.leaseEnd ? formatDate(tn.leaseEnd) : '',
          tn.contractDuration || '',
          tn.status,
          tn.tenantScore,
          tn.latePaymentCount,
        ]
      })
      const wsTenants = XLSX.utils.aoa_to_sheet([tenantsHeader, ...tenantsRows])
      wsTenants['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsTenants, 'Tenants')

      // ── Sheet 4: Payments ──
      const paymentsHeader = [
        'Date', 'Tenant Name', 'Property', 'Unit', 'Month', 'Year',
        'Amount (AED)', 'Method', 'Reference', 'Late?', 'Days Late',
      ]
      const paymentsRows = payments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(p => {
          const tenant = tenants.find(tn => tn.id === p.tenantId)
          const prop = tenant ? properties.find(pr => pr.id === tenant.propertyId) : null
          return [
            formatDate(p.date),
            tenant?.name || '',
            prop?.name || '',
            tenant?.unitNumber || '',
            getMonthName(p.month, 'en'),
            p.year,
            p.amount,
            p.method || '',
            p.reference || '',
            p.isLate ? 'Yes' : 'No',
            p.daysLate,
          ]
        })
      const wsPayments = XLSX.utils.aoa_to_sheet([paymentsHeader, ...paymentsRows])
      wsPayments['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 8 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments')

      // ── Sheet 5: Expenses ──
      const expensesHeader = [
        'Date', 'Category', 'Description', 'Amount (AED)', 'Vendor',
        'Invoice Number', 'Building', 'Recurring',
      ]
      const expensesRows = expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(e => [
          formatDate(e.date),
          getExpenseCategoryLabelExport(e.category),
          e.description,
          e.amount,
          e.vendor || '',
          e.invoiceNumber || '',
          e.building || '',
          e.recurring ? 'Yes' : 'No',
        ])
      const wsExpenses = XLSX.utils.aoa_to_sheet([expensesHeader, ...expensesRows])
      wsExpenses['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

      // ── Sheet 6: Maintenance ──
      const maintenanceHeader = [
        'Title', 'Category', 'Priority', 'Status', 'Property',
        'Vendor', 'Estimated Cost (AED)', 'Actual Cost (AED)',
        'Description', 'Date Created', 'Date Completed',
      ]
      const maintenanceRows = maintenanceItems.map(m => {
        const prop = properties.find(p => p.id === m.propertyId)
        return [
          m.title,
          getMaintenanceCategoryLabelExport(m.category),
          m.priority,
          m.status,
          prop?.name || '',
          m.vendor || '',
          m.estimatedCost || '',
          m.actualCost || '',
          m.description,
          formatDate(m.createdAt),
          m.completedAt ? formatDate(m.completedAt) : '',
        ]
      })
      const wsMaintenance = XLSX.utils.aoa_to_sheet([maintenanceHeader, ...maintenanceRows])
      wsMaintenance['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsMaintenance, 'Maintenance')

      // Generate and download
      const fileName = `Al_Reef_Report_${getMonthName(selectedMonth, 'en')}_${selectedYear}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success(t('exportSuccess', lang))
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(t('exportFailed', lang))
    } finally {
      setExporting(false)
    }
  }, [selectedMonth, selectedYear, lang])

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

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t('noData', lang)}</div>
  }

  const expensePieData = Object.entries(data.expenseBreakdown).map(([key, value]) => ({
    name: getExpenseCategoryLabel(key, lang),
    value,
  }))

  const trendChartData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }))

  // Revenue analysis monthly trend data
  const revenueTrendData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expected: data.expectedRevenue,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">{t('reports', lang)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportXLSX}
            disabled={exporting}
            className="bg-emerald hover:bg-emerald/90 text-white"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            {exporting ? t('loading', lang) : t('exportData', lang)}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-emerald hover:bg-emerald/90 text-white"
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {exportingPDF ? t('loading', lang) : t('exportPDF', lang)}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-emerald text-emerald">
            <Download className="w-4 h-4 mr-2" />
            {t('printReport', lang)}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {getMonthName(selectedMonth, lang)} {selectedYear}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <p className="text-xs text-muted-foreground">{t('revenue', lang)}</p>
            </div>
            <p className="text-xl font-bold text-emerald">{formatAED(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ofExpected', lang)} {formatAED(data.expectedRevenue)} {t('expected', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-terracotta" />
              <p className="text-xs text-muted-foreground">{t('expenses', lang)}</p>
            </div>
            <p className="text-xl font-bold text-terracotta">{formatAED(data.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`card-hover border-l-4 ${data.profitLoss >= 0 ? 'border-l-emerald' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-500'}`} />
              <p className="text-xs text-muted-foreground">{t('profitOrLoss', lang)}</p>
            </div>
            <p className={`text-xl font-bold ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-600'}`}>
              {formatAED(data.profitLoss)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-deep-teal" />
              <p className="text-xs text-muted-foreground">{t('collectionRate', lang)}</p>
            </div>
            <p className="text-xl font-bold text-deep-teal">{data.collectionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.occupiedUnits}/{data.totalUnits} {t('occupiedUnits', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="lg:col-span-2" ref={barChartRef}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('sixMonthTrend', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatAED(value)}
                    contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name={t('revenue', lang)} fill="#0D7C3D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('expenses', lang)} fill="#C4653A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card ref={pieChartRef}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('expenseBreakdown', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAED(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis Section */}
      <Card ref={areaChartRef}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald" />
            {t('revenueAnalysis', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend Line Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('monthlyTrend', lang)}</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatAED(value)}
                      contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name={t('revenue', lang)} stroke="#0D7C3D" fill="#0D7C3D" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('totalRevenue', lang)}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald" />
                    <span className="text-sm">{t('rentalIncome', lang)}</span>
                  </div>
                  <span className="font-semibold text-emerald">{formatAED(data.rentalIncome)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t('otherIncome', lang)}</span>
                  </div>
                  <span className="font-semibold">{formatAED(data.otherIncome)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between p-3 rounded-lg bg-emerald/10">
                  <span className="text-sm font-semibold">{t('grossRevenue', lang)}</span>
                  <span className="font-bold text-emerald">{formatAED(data.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('vacancyLoss', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.vacancyLoss)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('badDebt', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.badDebt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald" />
            {t('profitAndLoss', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-emerald/5">
              <span className="text-sm font-medium">{t('rentalIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-emerald text-right">{formatAED(data.rentalIncome)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-muted/30">
              <span className="text-sm">{t('otherIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-right">{formatAED(data.otherIncome)}</span>
            </div>

            {/* Gross Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-emerald/30 bg-emerald/5">
              <span className="text-sm font-bold">{t('grossRevenue', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-bold text-emerald text-right">{formatAED(data.grossRevenue)}</span>
            </div>

            {/* Deductions */}
            <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3">
              {t('costOfOperations', lang)}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('vacancyLoss', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.vacancyLoss)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('badDebt', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.badDebt)}</span>
            </div>

            {/* Gross Profit */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-amber-300 bg-amber-50">
              <span className="text-sm font-bold">{t('grossProfit', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className={`font-bold text-right ${data.grossProfit >= 0 ? 'text-emerald' : 'text-red-600'}`}>{formatAED(data.grossProfit)}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('operatingExpenses', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.costOfOperations)}</span>
            </div>

            {/* Net Income */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-4 rounded-lg border-2 border-emerald bg-emerald/10">
              <span className="text-base font-bold">{t('netIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <div className="flex items-center gap-2">
                {data.netIncome >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald" />
                ) : data.netIncome < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                ) : (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-lg font-bold text-right ${data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}`}>
                  {formatAED(data.netIncome)}
                </span>
              </div>
            </div>

            {/* Margin indicator */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              <span>{t('collectionRate', lang)}: <strong className="text-foreground">{data.collectionRate}%</strong></span>
              <span>|</span>
              <span>{t('occupancyRate', lang)}: <strong className="text-foreground">{data.occupancyRate}%</strong></span>
              <span>|</span>
              <span>{t('netProfit', lang)}: <strong className={data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}>
                {data.grossRevenue > 0 ? ((data.netIncome / data.grossRevenue) * 100).toFixed(1) : 0}%
              </strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('expenseDetails', lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.monthlyExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(e.category)}</span>
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getExpenseCategoryLabel(e.category, lang)}
                      </Badge>
                      {e.vendor && <span className="text-xs text-muted-foreground">{e.vendor}</span>}
                      {e.recurring && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t('recurring', lang)}</Badge>}
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-terracotta">{formatAED(e.amount)}</span>
              </div>
            ))}
            {data.monthlyExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
