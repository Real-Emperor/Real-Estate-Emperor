'use client'

import { useRef, useState } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { formatAED, formatDate } from '@/lib/utils'
import { t, type Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Download, Loader2 } from 'lucide-react'

interface BillInvoiceProps {
  tenant: TenantData
  property: PropertyData | undefined
  month: number
  year: number
  paymentStatus: 'paid' | 'partial' | 'overdue' | 'unpaid' | 'due-soon'
  paidAmount: number
  language: Language
  onClose?: () => void
}

export default function BillInvoice({
  tenant,
  property,
  month,
  year,
  paymentStatus,
  paidAmount,
  language,
}: BillInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [includeMuniFee, setIncludeMuniFee] = useState(!!tenant.municipalityFee)
  const [downloading, setDownloading] = useState(false)

  const muniFee = includeMuniFee ? Math.round(tenant.rentAmount * 0.05) : 0
  const totalDue = tenant.rentAmount + muniFee
  const remaining = totalDue - paidAmount
  const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${tenant.unitNumber || '000'}`
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const invoiceDate = new Date()
  const dueDay = 5
  const dueDate = new Date(year, month - 1, dueDay)

  const statusLabel = () => {
    switch (paymentStatus) {
      case 'paid': return t('paid', language)
      case 'partial': return t('partial', language)
      case 'overdue': return t('overdue', language)
      case 'unpaid': return t('unpaid', language)
      case 'due-soon': return t('dueSoon', language)
      default: return paymentStatus
    }
  }

  const statusColor = () => {
    switch (paymentStatus) {
      case 'paid': return '#0D7C3D'
      case 'partial': return '#D97706'
      case 'overdue': return '#DC2626'
      case 'unpaid': return '#EA580C'
      case 'due-soon': return '#CA8A04'
      default: return '#6B7280'
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return

    try {
      setDownloading(true)

      // Use html2canvas with improved settings for dialog context
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure the cloned element is visible and not clipped
          const clonedEl = clonedDoc.querySelector('[data-invoice-content]') as HTMLElement
          if (clonedEl) {
            clonedEl.style.overflow = 'visible'
            clonedEl.style.maxHeight = 'none'
            clonedEl.style.height = 'auto'
          }
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pdfWidth - margin * 2
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = contentWidth / imgWidth
      const scaledHeight = imgHeight * ratio

      // If content fits on one page, center it; otherwise split across pages
      if (scaledHeight <= pdfHeight - margin * 2) {
        const imgX = margin
        const imgY = margin
        pdf.addImage(imgData, 'PNG', imgX, imgY, contentWidth, scaledHeight)
      } else {
        // Multi-page: split the canvas image
        const pageContentHeight = pdfHeight - margin * 2
        const sourcePageHeight = (pageContentHeight / ratio)
        let sourceY = 0

        while (sourceY < imgHeight) {
          // Create a sub-canvas for this page
          const sliceHeight = Math.min(sourcePageHeight, imgHeight - sourceY)
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = imgWidth
          pageCanvas.height = sliceHeight
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, sourceY, imgWidth, sliceHeight,
              0, 0, imgWidth, sliceHeight
            )
          }

          const pageImgData = pageCanvas.toDataURL('image/png')
          const pageScaledHeight = sliceHeight * ratio

          if (sourceY > 0) {
            pdf.addPage()
          }
          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, pageScaledHeight)
          sourceY += sourcePageHeight
        }
      }

      pdf.save(`${invoiceNumber}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      // Fallback: programmatic PDF generation
      try {
        generateProgrammaticPDF()
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError)
      }
    } finally {
      setDownloading(false)
    }
  }

  // Fallback: fully programmatic PDF generation (no html2canvas dependency)
  const generateProgrammaticPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let y = 20

    // Header
    pdf.setFillColor(13, 124, 61)
    pdf.rect(0, 0, pageWidth, 35, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.text('Al Reef Al Junoobi', margin, 15)
    pdf.setFontSize(9)
    pdf.text('Real Estate & General Maintenance L.L.C.', margin, 22)
    pdf.text(`Tel: +971-2-555-0100 | Email: info@alreefjunoobi.ae`, margin, 28)

    // Invoice title
    pdf.setFontSize(22)
    pdf.text(t('invoice', language), pageWidth - margin, 15, { align: 'right' })
    pdf.setFontSize(10)
    pdf.text(`${t('invoiceNumber', language)}: ${invoiceNumber}`, pageWidth - margin, 22, { align: 'right' })
    pdf.text(`${t('invoiceDate', language)}: ${formatDate(invoiceDate.toISOString())}`, pageWidth - margin, 27, { align: 'right' })
    pdf.text(`${t('dueDate', language)}: ${formatDate(dueDate.toISOString())}`, pageWidth - margin, 32, { align: 'right' })

    y = 45
    pdf.setTextColor(0, 0, 0)

    // Bill To section
    pdf.setFillColor(245, 245, 245)
    pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F')
    pdf.setFontSize(10)
    pdf.setTextColor(13, 124, 61)
    pdf.text(t('billTo', language), margin + 4, y + 6)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.text(tenant.name, margin + 4, y + 13)
    if (tenant.nameAr) pdf.text(tenant.nameAr, margin + 4, y + 18)
    pdf.text(`${property?.name || ''} | ${t('unitNumber', language)}: ${tenant.unitNumber || '-'}`, margin + 80, y + 13)
    if (tenant.phone) pdf.text(`${t('phone', language)}: ${tenant.phone}`, margin + 80, y + 18)
    if (tenant.emiratesId) pdf.text(`${t('emiratesId', language)}: ${tenant.emiratesId}`, margin + 80, y + 24)

    y += 38

    // Invoice table header
    pdf.setFillColor(13, 124, 61)
    pdf.rect(margin, y, contentWidth, 8, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.text('#', margin + 4, y + 5.5)
    pdf.text(t('description', language), margin + 15, y + 5.5)
    pdf.text(t('amount', language), margin + contentWidth - 4, y + 5.5, { align: 'right' })
    y += 8

    // Line items
    pdf.setTextColor(0, 0, 0)
    let itemNum = 1

    // Rent item
    pdf.setFontSize(9)
    pdf.text(String(itemNum), margin + 4, y + 5)
    pdf.text(`${t('monthlyRent', language)} - ${monthNames[month - 1]} ${year}`, margin + 15, y + 5)
    pdf.text(formatAED(tenant.rentAmount), margin + contentWidth - 4, y + 5, { align: 'right' })
    y += 5
    pdf.setFontSize(7)
    pdf.setTextColor(120, 120, 120)
    pdf.text(`${property?.name || ''} - ${t('unitNumber', language)}: ${tenant.unitNumber || '-'}`, margin + 15, y + 3)
    y += 8
    itemNum++

    // Municipality Fee item (only if included)
    if (includeMuniFee) {
      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)
      pdf.text(String(itemNum), margin + 4, y + 5)
      pdf.text(t('municipalityFee', language), margin + 15, y + 5)
      pdf.text(formatAED(muniFee), margin + contentWidth - 4, y + 5, { align: 'right' })
      y += 5
      pdf.setFontSize(7)
      pdf.setTextColor(120, 120, 120)
      pdf.text(`5% of ${formatAED(tenant.rentAmount)}`, margin + 15, y + 3)
      y += 8
    }

    // Separator
    y += 5
    pdf.setDrawColor(13, 124, 61)
    pdf.setLineWidth(0.5)
    pdf.line(margin + contentWidth * 0.5, y, margin + contentWidth, y)
    y += 5

    // Totals section
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)
    pdf.text(t('subtotal', language), margin + contentWidth * 0.55, y + 3)
    pdf.text(formatAED(tenant.rentAmount), margin + contentWidth - 4, y + 3, { align: 'right' })
    y += 6

    if (includeMuniFee) {
      pdf.text(t('municipalityFee', language), margin + contentWidth * 0.55, y + 3)
      pdf.text(formatAED(muniFee), margin + contentWidth - 4, y + 3, { align: 'right' })
      y += 6
    }

    pdf.setLineWidth(1)
    pdf.line(margin + contentWidth * 0.5, y, margin + contentWidth, y)
    y += 4

    pdf.setFontSize(11)
    pdf.setTextColor(13, 124, 61)
    pdf.text(t('totalDue', language), margin + contentWidth * 0.55, y + 4)
    pdf.text(formatAED(totalDue), margin + contentWidth - 4, y + 4, { align: 'right' })
    y += 8

    if (paidAmount > 0) {
      pdf.setFontSize(9)
      pdf.setTextColor(13, 124, 61)
      pdf.text(t('paid', language), margin + contentWidth * 0.55, y + 3)
      pdf.text(`-${formatAED(paidAmount)}`, margin + contentWidth - 4, y + 3, { align: 'right' })
      y += 6
      pdf.setTextColor(220, 38, 38)
      pdf.setFontSize(10)
      pdf.text(t('remaining', language), margin + contentWidth * 0.55, y + 4)
      pdf.text(formatAED(remaining), margin + contentWidth - 4, y + 4, { align: 'right' })
      y += 8
    }

    // Payment Status
    y += 5
    pdf.setFillColor(245, 245, 245)
    pdf.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F')
    pdf.setFontSize(8)
    pdf.setTextColor(120, 120, 120)
    pdf.text(t('paymentStatus', language), margin + 4, y + 5)
    pdf.setFontSize(12)
    pdf.setTextColor(parseInt(statusColor().slice(1, 3), 16), parseInt(statusColor().slice(3, 5), 16), parseInt(statusColor().slice(5, 7), 16))
    pdf.text(statusLabel(), margin + 4, y + 12)
    if (tenant.leaseStart || tenant.leaseEnd) {
      pdf.setFontSize(7)
      pdf.setTextColor(120, 120, 120)
      pdf.text(`${t('leaseStart', language)}: ${tenant.leaseStart ? formatDate(tenant.leaseStart) : '-'}  |  ${t('leaseEnd', language)}: ${tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '-'}`, margin + contentWidth - 4, y + 12, { align: 'right' })
    }

    // Footer
    const pageHeight = pdf.internal.pageSize.getHeight()
    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    pdf.text('Al Reef Al Junoobi Real Estate & General Maintenance L.L.C. | Khalifa City A, Abu Dhabi, UAE', pageWidth / 2, pageHeight - 8, { align: 'center' })
    pdf.text('Thank you for your payment. For questions, contact info@alreefjunoobi.ae or +971-2-555-0100', pageWidth / 2, pageHeight - 4, { align: 'center' })

    pdf.save(`${invoiceNumber}.pdf`)
  }

  return (
    <div className="space-y-4">
      {/* Municipality Fee Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Label htmlFor="muni-fee-toggle" className="text-sm font-medium cursor-pointer">
            {t('includeMunicipalityFee', language)}
          </Label>
          <span className="text-xs text-muted-foreground">
            ({t('municipalityFee', language)} - 5%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('no', language)}</span>
          <Switch
            id="muni-fee-toggle"
            checked={includeMuniFee}
            onCheckedChange={setIncludeMuniFee}
          />
          <span className="text-xs text-muted-foreground">{t('yes', language)}</span>
        </div>
      </div>

      {/* Printable Invoice */}
      <div
        ref={invoiceRef}
        data-invoice-content
        className="bg-white text-gray-900 p-8 max-w-[210mm] mx-auto"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">AR</div>
              <div>
                <h1 className="text-xl font-bold text-emerald-700">Al Reef Al Junoobi</h1>
                <p className="text-xs text-gray-500">Real Estate & General Maintenance L.L.C.</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-0.5">
              <p>Khalifa City A, Abu Dhabi, UAE</p>
              <p>Tel: +971-2-555-0100 | Email: info@alreefjunoobi.ae</p>
              <p>{t('taxId', language)}: 300000000000003</p>
              <p>{t('commercialLicense', language)}: CN-1234567</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-emerald-700">{t('invoice', language)}</h2>
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              <p><span className="font-medium">{t('invoiceNumber', language)}:</span> {invoiceNumber}</p>
              <p><span className="font-medium">{t('invoiceDate', language)}:</span> {formatDate(invoiceDate.toISOString())}</p>
              <p><span className="font-medium">{t('dueDate', language)}:</span> {formatDate(dueDate.toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-emerald-700 mb-2">{t('billTo', language)}</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{tenant.name}</p>
              {tenant.nameAr && <p className="text-gray-600" dir="rtl">{tenant.nameAr}</p>}
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{property?.name || ''}</p>
              <p>{t('unitNumber', language)}: {tenant.unitNumber || '—'}</p>
              <p>{t('floor2', language)}: {tenant.floor || '—'}</p>
            </div>
            <div className="text-gray-600">
              {tenant.phone && <p>{t('phone', language)}: {tenant.phone}</p>}
              {tenant.emiratesId && <p>{t('emiratesId', language)}: {tenant.emiratesId}</p>}
            </div>
            <div className="text-right text-gray-600">
              {tenant.nationality && <p>{t('nationality', language)}: {tenant.nationality}</p>}
              {tenant.employer && <p>{t('employer2', language)}: {tenant.employer}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="bg-emerald-600 text-white">
              <th className="text-left py-2 px-4 rounded-tl-md">#</th>
              <th className="text-left py-2 px-4">{t('description', language)}</th>
              <th className="text-right py-2 px-4">{t('amount', language)}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 text-gray-500">1</td>
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{t('monthlyRent', language)} — {monthNames[month - 1]} {year}</p>
                <p className="text-xs text-gray-500">{property?.name || ''} — {t('unitNumber', language)}: {tenant.unitNumber || '—'}</p>
              </td>
              <td className="py-3 px-4 text-right font-medium">{formatAED(tenant.rentAmount)}</td>
            </tr>
            {includeMuniFee && (
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-500">2</td>
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{t('municipalityFee', language)}</p>
                  <p className="text-xs text-gray-500">5% of {formatAED(tenant.rentAmount)}</p>
                </td>
                <td className="py-3 px-4 text-right font-medium">{formatAED(muniFee)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">{t('subtotal', language)}</span>
              <span className="font-medium">{formatAED(tenant.rentAmount)}</span>
            </div>
            {includeMuniFee && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">{t('municipalityFee', language)}</span>
                <span className="font-medium">{formatAED(muniFee)}</span>
              </div>
            )}
            <div className="border-t-2 border-emerald-600 flex justify-between py-2">
              <span className="font-bold text-emerald-700">{t('totalDue', language)}</span>
              <span className="font-bold text-emerald-700 text-lg">{formatAED(totalDue)}</span>
            </div>
            {paidAmount > 0 && (
              <>
                <div className="flex justify-between py-1 text-sm text-emerald-600">
                  <span>{t('paid', language)}</span>
                  <span>-{formatAED(paidAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300">
                  <span className="font-bold text-gray-700">{t('remaining', language)}</span>
                  <span className="font-bold text-red-600">{formatAED(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-6">
          <div>
            <p className="text-xs text-gray-500">{t('paymentStatus', language)}</p>
            <p className="font-bold text-lg" style={{ color: statusColor() }}>{statusLabel()}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>{t('leaseStart', language)}: {tenant.leaseStart ? formatDate(tenant.leaseStart) : '—'}</p>
            <p>{t('leaseEnd', language)}: {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '—'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>Al Reef Al Junoobi Real Estate & General Maintenance L.L.C. | Khalifa City A, Abu Dhabi, UAE</p>
          <p>Thank you for your payment. For questions, contact info@alreefjunoobi.ae or +971-2-555-0100</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-emerald hover:bg-emerald/90 text-white"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {downloading ? t('loading', language) : t('downloadBill', language)}
        </Button>
      </div>
    </div>
  )
}
