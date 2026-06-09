import prisma from '@/lib/db'
import {
  getAuthUser,
  serialize,
  unauthorizedResponse,
  errorResponse,
  successResponse,
  createAuditLog,
  safeDecimal,
} from '@/lib/api-utils'

// POST /api/recurring-bills/pay — Record a payment on a recurring bill
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const companyId = user.companyId
    const body = await request.json()

    // Validate required fields
    if (!body.recurringBillId || !body.amount || !body.paymentDate) {
      return errorResponse('Missing required fields: recurringBillId, amount, paymentDate')
    }

    const paymentAmount = safeDecimal(body.amount)
    if (paymentAmount <= 0) {
      return errorResponse('Payment amount must be greater than zero')
    }

    // Get the bill
    const bill = await prisma.recurringBill.findFirst({
      where: { id: body.recurringBillId, companyId, isActive: true, deletedAt: null },
    })

    if (!bill) {
      return errorResponse('Recurring bill not found', 404)
    }

    const currentOutstanding = Number(bill.currentOutstandingBalance)
    const monthlyExpected = Number(bill.monthlyExpectedAmount)

    // Calculate remaining outstanding
    const remaining = currentOutstanding - paymentAmount
    const previousOutstanding = currentOutstanding

    // Determine new status
    let newStatus: string
    let newOutstanding: number

    if (remaining <= 0) {
      newStatus = 'paid'
      newOutstanding = 0
    } else {
      newStatus = 'partially_paid'
      newOutstanding = remaining
    }

    // Calculate new totalAmountDue
    const newTotalAmountDue = newOutstanding + monthlyExpected

    // Advance nextDueDate based on billingFrequency
    let nextDueDate: Date | null = null
    if (bill.nextDueDate) {
      const currentDue = new Date(bill.nextDueDate)
      switch (bill.billingFrequency) {
        case 'monthly':
          currentDue.setMonth(currentDue.getMonth() + 1)
          break
        case 'quarterly':
          currentDue.setMonth(currentDue.getMonth() + 3)
          break
        case 'annually':
          currentDue.setFullYear(currentDue.getFullYear() + 1)
          break
      }
      nextDueDate = currentDue
    }

    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Update the bill
      const updatedBill = await tx.recurringBill.update({
        where: { id: bill.id },
        data: {
          previousOutstandingBalance: safeDecimal(previousOutstanding),
          currentOutstandingBalance: safeDecimal(newOutstanding),
          totalAmountDue: safeDecimal(newTotalAmountDue),
          lastPaymentAmount: safeDecimal(paymentAmount),
          lastPaymentDate: new Date(body.paymentDate),
          nextDueDate,
          status: newStatus,
        },
      })

      // Create payment record
      const payment = await tx.recurringBillPayment.create({
        data: {
          recurringBillId: bill.id,
          companyId,
          amount: safeDecimal(paymentAmount),
          paymentDate: new Date(body.paymentDate),
          method: body.method || null,
          reference: body.reference || null,
          notes: body.notes || null,
          outstandingAfterPayment: safeDecimal(newOutstanding),
        },
      })

      // Create an Expense record (category: 'utility')
      const expense = await tx.expense.create({
        data: {
          companyId,
          category: 'utility',
          description: `${bill.serviceType} - ${bill.providerName} (Bill Payment)`,
          amount: safeDecimal(paymentAmount),
          date: new Date(body.paymentDate),
          vendor: bill.providerName,
          recurring: false,
        },
      })

      return { updatedBill, payment, expense }
    })

    // Create audit log
    await createAuditLog({
      action: 'PAYMENT',
      entity: 'RecurringBill',
      entityId: bill.id,
      userId: user.id,
      companyId,
      details: {
        providerName: bill.providerName,
        serviceType: bill.serviceType,
        paymentAmount: Number(paymentAmount),
        previousOutstanding,
        newOutstanding,
        newStatus,
        expenseId: result.expense.id,
      },
    })

    return successResponse({
      bill: serialize(result.updatedBill),
      payment: serialize(result.payment),
      expense: serialize(result.expense),
    })
  } catch (error) {
    console.error('Pay recurring bill error:', error)
    return errorResponse('Failed to record payment', 500)
  }
}
