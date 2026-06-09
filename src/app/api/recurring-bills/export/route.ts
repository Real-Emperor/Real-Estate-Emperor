import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/api-utils'

// GET /api/recurring-bills/export — Export recurring bills data
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const companyId = user.companyId
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'

    // Fetch all active bills with payments
    const bills = await prisma.recurringBill.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      include: {
        property: {
          select: { id: true, name: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    })

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, nameAr: true, phone: true, email: true, address: true },
    })

    const serializedBills = bills.map(b => serialize(b))

    // Summary stats
    const totalBills = serializedBills.length
    const paidBills = serializedBills.filter(b => b.status === 'paid').length
    const overdueBills = serializedBills.filter(b => b.status === 'overdue').length
    const outstandingBalance = serializedBills.reduce((sum, b) => sum + Number(b.currentOutstandingBalance || 0), 0)

    // Separate by status
    const paidList = serializedBills.filter(b => b.status === 'paid')
    const partiallyPaidList = serializedBills.filter(b => b.status === 'partially_paid')
    const upcomingList = serializedBills.filter(b => b.status === 'active')
    const overdueList = serializedBills.filter(b => b.status === 'overdue')

    if (format === 'pdf') {
      // Dynamic import for jspdf
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Company branding header
      doc.setFontSize(18)
      doc.text(company?.name || 'Real Estate Emperor', 14, 20)
      doc.setFontSize(10)
      doc.text(`Phone: ${company?.phone || 'N/A'} | Email: ${company?.email || 'N/A'}`, 14, 28)
      doc.text(`Address: ${company?.address || 'N/A'}`, 14, 34)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40)

      // Summary section
      doc.setFontSize(14)
      doc.text('Recurring Bills Summary', 14, 52)
      doc.setFontSize(10)
      doc.text(`Total Bills: ${totalBills}`, 14, 60)
      doc.text(`Paid: ${paidBills}`, 14, 66)
      doc.text(`Overdue: ${overdueBills}`, 14, 72)
      doc.text(`Outstanding Balance: AED ${outstandingBalance.toLocaleString()}`, 14, 78)

      // Table sections
      let yPos = 90

      const drawTable = (title: string, items: any[]) => {
        if (items.length === 0) return
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(12)
        doc.text(title, 14, yPos)
        yPos += 8
        doc.setFontSize(8)

        // Header row
        doc.text('Provider', 14, yPos)
        doc.text('Service', 60, yPos)
        doc.text('Property', 95, yPos)
        doc.text('Amount', 135, yPos)
        doc.text('Outstanding', 165, yPos)
        doc.text('Due Date', 200, yPos)
        yPos += 6

        items.forEach(item => {
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
          doc.text(String(item.providerName || '').substring(0, 20), 14, yPos)
          doc.text(String(item.serviceType || '').substring(0, 15), 60, yPos)
          doc.text(String(item.property?.name || '').substring(0, 15), 95, yPos)
          doc.text(`AED ${Number(item.monthlyExpectedAmount || 0).toLocaleString()}`, 135, yPos)
          doc.text(`AED ${Number(item.currentOutstandingBalance || 0).toLocaleString()}`, 165, yPos)
          doc.text(item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A', 200, yPos)
          yPos += 5
        })
        yPos += 8
      }

      drawTable('Paid Bills', paidList)
      drawTable('Partially Paid Bills', partiallyPaidList)
      drawTable('Upcoming Bills', upcomingList)
      drawTable('Overdue Bills', overdueList)

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="recurring-bills-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    // Default: XLSX format
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Recurring Bills & Utilities Report'],
      ['Company', company?.name || ''],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Summary'],
      ['Total Bills', totalBills],
      ['Paid', paidBills],
      ['Overdue', overdueBills],
      ['Outstanding Balance', outstandingBalance],
      [],
    ]
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Helper to create bill sheet
    const createBillSheet = (title: string, items: any[]) => {
      const header = ['Provider', 'Service Type', 'Property', 'Monthly Amount (AED)', 'Outstanding (AED)', 'Total Due (AED)', 'Last Payment', 'Next Due', 'Status', 'Frequency']
      const rows = items.map(b => [
        b.providerName,
        b.serviceType,
        b.property?.name || '',
        Number(b.monthlyExpectedAmount || 0),
        Number(b.currentOutstandingBalance || 0),
        Number(b.totalAmountDue || 0),
        b.lastPaymentDate ? new Date(b.lastPaymentDate).toLocaleDateString() : '',
        b.nextDueDate ? new Date(b.nextDueDate).toLocaleDateString() : '',
        b.status,
        b.billingFrequency,
      ])
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      return ws
    }

    // All bills sheet
    const allWs = createBillSheet('All Bills', serializedBills)
    XLSX.utils.book_append_sheet(wb, allWs, 'All Bills')

    // Status-specific sheets
    if (paidList.length > 0) {
      XLSX.utils.book_append_sheet(wb, createBillSheet('Paid', paidList), 'Paid')
    }
    if (partiallyPaidList.length > 0) {
      XLSX.utils.book_append_sheet(wb, createBillSheet('Partially Paid', partiallyPaidList), 'Partially Paid')
    }
    if (upcomingList.length > 0) {
      XLSX.utils.book_append_sheet(wb, createBillSheet('Upcoming', upcomingList), 'Upcoming')
    }
    if (overdueList.length > 0) {
      XLSX.utils.book_append_sheet(wb, createBillSheet('Overdue', overdueList), 'Overdue')
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="recurring-bills-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export recurring bills error:', error)
    return errorResponse('Failed to export recurring bills', 500)
  }
}
