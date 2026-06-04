import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-utils'

// Helper: Convert number to words (simple implementation for AED)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'

  const convertHundreds = (n: number): string => {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' and ' + convertHundreds(n % 100) : '')
  }

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  let words = ''
  if (intPart >= 1000000) {
    words += convertHundreds(Math.floor(intPart / 1000000)) + ' Million '
  }
  const thousands = intPart % 1000000
  if (thousands >= 1000) {
    words += convertHundreds(Math.floor(thousands / 1000)) + ' Thousand '
  }
  const remainder = thousands % 1000
  if (remainder > 0) {
    words += convertHundreds(remainder)
  }

  words = words.trim() + ' AED'
  if (decPart > 0) {
    words += ' and ' + convertHundreds(decPart) + ' Fils'
  }

  return words || 'Zero AED'
}

// GET /api/receipts/[id]/html — Generate printable HTML receipt
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
        tenant: { select: { name: true, nameAr: true, unitNumber: true, phone: true, email: true } },
        company: { select: { name: true, nameAr: true, phone: true, email: true, address: true } },
      },
    })

    if (!receipt) return errorResponse('Receipt not found', 404)

    const amountInWords = numberToWords(receipt.amount)
    const receiptDate = new Date(receipt.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })
    const companyName = receipt.company?.name || 'Al Reef Al Junoobi'
    const companyAr = receipt.company?.nameAr || 'الريف الجنوبي'
    const companyAddr = receipt.company?.address || ''
    const companyPhone = receipt.company?.phone || ''
    const companyEmail = receipt.company?.email || ''

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 40px; }
    .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #0F766E; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0F766E, #115E59); color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header .company-ar { font-size: 16px; opacity: 0.8; direction: rtl; }
    .receipt-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; text-align: right; }
    .receipt-badge .label { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .receipt-badge .number { font-size: 18px; font-weight: 700; }
    .body { padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .info-box { background: #F8FAFC; border-radius: 8px; padding: 16px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-bottom: 8px; }
    .info-box p { font-size: 14px; font-weight: 600; color: #1E293B; }
    .info-box .sub { font-weight: 400; color: #64748B; font-size: 13px; }
    .amount-section { background: linear-gradient(135deg, #F0FDFA, #CCFBF1); border: 1px solid #99F6E4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .amount-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0F766E; margin-bottom: 4px; }
    .amount-value { font-size: 36px; font-weight: 800; color: #0F766E; }
    .amount-currency { font-size: 16px; font-weight: 400; color: #0F766E; }
    .amount-words { font-size: 13px; color: #334155; margin-top: 8px; font-style: italic; }
    .divider { border: none; border-top: 1px dashed #CBD5E1; margin: 16px 0; }
    .footer { background: #F8FAFC; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B; }
    .footer .left { }
    .footer .right { text-align: right; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div>
        <h1>${companyName}</h1>
        <div class="company-ar">${companyAr}</div>
        ${companyAddr ? `<div style="font-size:12px;opacity:0.7;margin-top:4px;">${companyAddr}</div>` : ''}
        ${companyPhone ? `<div style="font-size:12px;opacity:0.7;">${companyPhone}${companyEmail ? ' | ' + companyEmail : ''}</div>` : ''}
      </div>
      <div class="receipt-badge">
        <div class="label">Receipt No.</div>
        <div class="number">${receipt.receiptNumber}</div>
        <div style="font-size:11px;opacity:0.8;">${receiptDate}</div>
      </div>
    </div>
    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <h3>Received From</h3>
          <p>${receipt.tenant?.name || 'N/A'}</p>
          ${receipt.tenant?.nameAr ? `<div class="sub" dir="rtl">${receipt.tenant.nameAr}</div>` : ''}
          ${receipt.tenant?.unitNumber ? `<div class="sub">Unit: ${receipt.tenant.unitNumber}</div>` : ''}
          ${receipt.tenant?.phone ? `<div class="sub">Phone: ${receipt.tenant.phone}</div>` : ''}
        </div>
        <div class="info-box">
          <h3>Payment Details</h3>
          <p>Period: ${receipt.month}/${receipt.year}</p>
          ${receipt.description ? `<div class="sub">${receipt.description}</div>` : ''}
        </div>
      </div>
      <div class="amount-section">
        <div class="amount-label">Amount Received</div>
        <div class="amount-value">AED ${receipt.amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="amount-words">${amountInWords}</div>
      </div>
      <hr class="divider" />
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748B;">
        <div>Generated: ${new Date(receipt.createdAt).toLocaleString('en-AE')}</div>
        <div>This is a computer-generated receipt.</div>
      </div>
    </div>
    <div class="footer">
      <div class="left">Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.</div>
      <div class="right">Thank you for your payment!</div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating receipt HTML:', error)
    return errorResponse('Failed to generate receipt', 500)
  }
}
