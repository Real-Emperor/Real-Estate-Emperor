import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-utils'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

// GET /api/receipts/[id]/pdf — Generate and return PDF receipt
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can view receipts')
  }

  try {
    const { id } = await params

    const receipt = await prisma.receipt.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        tenant: { select: { id: true, name: true, nameAr: true, unitNumber: true, phone: true, email: true } },
        company: { select: { name: true, nameAr: true, phone: true, email: true, address: true } },
      },
    })

    if (!receipt) return errorResponse('Receipt not found', 404)

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    // ── Register embedded fonts for Arabic support ──
    const fontsDir = path.join(process.cwd(), 'public', 'fonts')
    const notoSansRegular = path.join(fontsDir, 'NotoSans-Regular.ttf')
    const notoSansBold = path.join(fontsDir, 'NotoSans-Bold.ttf')
    const notoSansArabicRegular = path.join(fontsDir, 'NotoSansArabic-Regular.ttf')
    const notoSansArabicBold = path.join(fontsDir, 'NotoSansArabic-Bold.ttf')

    const hasNotoSans = fs.existsSync(notoSansRegular) && fs.existsSync(notoSansBold)
    const hasNotoArabic = fs.existsSync(notoSansArabicRegular) && fs.existsSync(notoSansArabicBold)

    if (hasNotoSans) {
      doc.registerFont('NotoSans', notoSansRegular)
      doc.registerFont('NotoSans-Bold', notoSansBold)
    }
    if (hasNotoArabic) {
      doc.registerFont('NotoSansArabic', notoSansArabicRegular)
      doc.registerFont('NotoSansArabic-Bold', notoSansArabicBold)
    }

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Colors
    const teal = '#0F766E'
    const gold = '#D97706'
    const gray = '#6B7280'
    const lightGray = '#F3F4F6'

    // ── Header background ──
    doc.rect(0, 0, doc.page.width, 120).fill(teal)

    // Company name
    doc.fontSize(22).fillColor('#FFFFFF').font(hasNotoSans ? 'NotoSans-Bold' : 'Helvetica-Bold')
      .text(receipt.company.name, 50, 35, { width: 400 })

    if (receipt.company.nameAr) {
      doc.fontSize(12).fillColor('rgba(255,255,255,0.8)').font(hasNotoArabic ? 'NotoSansArabic' : 'Helvetica')
        .text(receipt.company.nameAr, 50, 65, { width: 400, features: ['rtla'] })
    }

    // Receipt title
    doc.fontSize(14).fillColor('#FFFFFF').font(hasNotoSans ? 'NotoSans-Bold' : 'Helvetica-Bold')
      .text('PAYMENT RECEIPT', 400, 45, { width: 150, align: 'right' })

    // Receipt number badge
    doc.roundedRect(400, 70, 150, 30, 4).fill(gold)
    doc.fontSize(11).fillColor('#FFFFFF')
      .text(receipt.receiptNumber, 400, 77, { width: 150, align: 'center' })

    // ── Date ──
    doc.fontSize(10).fillColor(gray)
      .text(
        `Date: ${new Date(receipt.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        50,
        140
      )

    // ── Divider ──
    doc.moveTo(50, 160).lineTo(doc.page.width - 50, 160).strokeColor(lightGray).lineWidth(1).stroke()

    // ── Paid stamp ──
    doc.save()
    doc.translate(420, 160)
    doc.rotate(-15)
    doc.roundedRect(-40, -15, 80, 30, 4).lineWidth(2).strokeColor(teal).stroke()
    doc.fontSize(16).fillColor(teal).text('PAID', -35, -8, { width: 70, align: 'center' })
    doc.restore()

    // ── Tenant information ──
    doc.fontSize(10).fillColor(gray).text('TENANT INFORMATION', 50, 180)
    doc.fontSize(12).fillColor('#1F2937')
      .text(receipt.tenant.name, 50, 198)

    if (receipt.tenant.nameAr) {
      doc.fontSize(11).fillColor(gray).font(hasNotoArabic ? 'NotoSansArabic' : 'Helvetica')
        .text(receipt.tenant.nameAr, 200, 199, { features: ['rtla'] })
    }

    doc.fontSize(10).fillColor(gray)
    if (receipt.tenant.unitNumber) {
      doc.text(`Unit: ${receipt.tenant.unitNumber}`, 50, 218)
    }
    if (receipt.tenant.phone) {
      doc.text(`Phone: ${receipt.tenant.phone}`, 180, 218)
    }

    // ── Payment details box ──
    const boxY = 250
    doc.roundedRect(50, boxY, doc.page.width - 100, 100, 8).fill(lightGray)

    // Column headers
    doc.fontSize(10).fillColor(gray).text('DESCRIPTION', 70, boxY + 15)
    doc.fontSize(10).fillColor(gray).text('MONTH', 300, boxY + 15)
    doc.fontSize(10).fillColor(gray).text('YEAR', 380, boxY + 15)
    doc.fontSize(10).fillColor(gray).text('AMOUNT (AED)', 450, boxY + 15, { width: 120, align: 'right' })

    // Separator line
    doc.moveTo(70, boxY + 32).lineTo(doc.page.width - 70, boxY + 32).strokeColor('#D1D5DB').lineWidth(0.5).stroke()

    // Data row
    doc.fontSize(12).fillColor('#1F2937')
      .text(receipt.description || 'Rent Payment', 70, boxY + 42)
    doc.fontSize(12).fillColor('#1F2937')
      .text(receipt.month ? new Date(2024, receipt.month - 1).toLocaleString('en', { month: 'long' }) : '-', 300, boxY + 42)
    doc.fontSize(12).fillColor('#1F2937')
      .text(String(receipt.year), 380, boxY + 42)
    doc.fontSize(12).fillColor('#1F2937')
      .text(new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 }).format(receipt.amount), 450, boxY + 42, { width: 120, align: 'right' })

    // Total line
    doc.moveTo(70, boxY + 65).lineTo(doc.page.width - 70, boxY + 65).strokeColor('#D1D5DB').lineWidth(1).stroke()

    doc.fontSize(14).fillColor(teal)
      .text('TOTAL', 70, boxY + 72)
    doc.fontSize(14).fillColor(teal)
      .text(`AED ${new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 }).format(receipt.amount)}`, 450, boxY + 72, { width: 120, align: 'right' })

    // ── Amount in words ──
    const amountInWords = numberToWords(receipt.amount)
    doc.fontSize(9).fillColor(gray)
      .text(`Amount in words: ${amountInWords} AED`, 50, boxY + 115)

    // ── Payment method ──
    if (receipt.paymentId) {
      doc.fontSize(9).fillColor(gray)
        .text(`Payment Reference: ${receipt.paymentId}`, 50, boxY + 132)
    }

    // ── Footer ──
    const footerY = doc.page.height - 100
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor(lightGray).lineWidth(1).stroke()

    doc.fontSize(8).fillColor(gray)
    if (receipt.company.address) doc.text(receipt.company.address, 50, footerY + 10)
    if (receipt.company.phone) doc.text(`Tel: ${receipt.company.phone}`, 50, footerY + 22)
    if (receipt.company.email) doc.text(`Email: ${receipt.company.email}`, 50, footerY + 34)

    // Thank you note
    doc.fontSize(9).fillColor(teal)
      .text('Thank you for your payment!', 50, footerY + 55)

    doc.end()

    const pdfBuffer = await pdfPromise

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${receipt.receiptNumber}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    return errorResponse('Failed to generate receipt PDF', 500)
  }
}

// Simple number to words converter for AED amounts
function numberToWords(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'

  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 1000000) return convert(Math.floor(n / 100000)) + ' Hundred' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '')
  }

  let result = convert(integerPart)
  if (decimalPart > 0) {
    result += ` and ${convert(decimalPart)} Fils`
  }
  return result
}
