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

// Helper: derive cycle status from paidAmount and amount
function deriveCycleStatus(paidAmount: number, amount: number): string {
  if (paidAmount <= 0) return 'pending'
  if (paidAmount < amount) return 'partially_paid'
  return 'paid'
}

// POST /api/recurring-bills/cycles/[cycleId]/payments — Record a payment against a specific BillCycle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { cycleId } = await params
    const companyId = user.companyId
    const body = await request.json()

    // Validate required fields
    if (!body.amount || !body.paymentDate) {
      return errorResponse('Missing required fields: amount, paymentDate')
    }

    const paymentAmount = safeDecimal(body.amount)
    if (paymentAmount <= 0) {
      return errorResponse('Payment amount must be greater than zero')
    }

    // Get the cycle with its parent bill
    const cycle = await prisma.billCycle.findFirst({
      where: { id: cycleId, companyId },
      include: {
        recurringBill: true,
      },
    })

    if (!cycle) {
      return errorResponse('Billing cycle not found', 404)
    }

    const bill = cycle.recurringBill

    // Calculate from the cycle's outstandingAmount
    const cycleOutstanding = Number(cycle.outstandingAmount)
    const cycleAmount = Number(cycle.amount)
    const currentPaid = Number(cycle.paidAmount)

    const newCycleOutstanding = Math.max(0, cycleOutstanding - paymentAmount)
    const newCyclePaid = currentPaid + paymentAmount

    // Derive the new cycle status
    const newCycleStatus = deriveCycleStatus(newCyclePaid, cycleAmount)

    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Update the cycle
      const updatedCycle = await tx.billCycle.update({
        where: { id: cycleId },
        data: {
          paidAmount: safeDecimal(newCyclePaid),
          outstandingAmount: safeDecimal(newCycleOutstanding),
          status: newCycleStatus,
        },
      })

      // Get the latest cycle for the bill to derive bill status
      const latestCycle = await tx.billCycle.findFirst({
        where: { recurringBillId: bill.id },
        orderBy: { createdAt: 'desc' },
      })

      const billStatus = latestCycle?.status || newCycleStatus
      const billOutstanding = latestCycle ? Number(latestCycle.outstandingAmount) : newCycleOutstanding

      // Advance nextDueDate based on billingFrequency (only if fully paid)
      let nextDueDate: Date | null = bill.nextDueDate ? new Date(bill.nextDueDate) : null
      if (newCycleStatus === 'paid' && nextDueDate) {
        switch (bill.billingFrequency) {
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1)
            break
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3)
            break
          case 'annually':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
            break
        }
      }

      // Update the parent bill
      const updatedBill = await tx.recurringBill.update({
        where: { id: bill.id },
        data: {
          currentOutstandingBalance: safeDecimal(billOutstanding),
          totalAmountDue: safeDecimal(billOutstanding + Number(bill.monthlyExpectedAmount)),
          lastPaymentAmount: safeDecimal(paymentAmount),
          lastPaymentDate: new Date(body.paymentDate),
          nextDueDate,
          status: billStatus,
        },
      })

      // Create payment record
      const payment = await tx.recurringBillPayment.create({
        data: {
          recurringBillId: bill.id,
          billCycleId: cycleId,
          companyId,
          amount: safeDecimal(paymentAmount),
          paymentDate: new Date(body.paymentDate),
          method: body.method || null,
          reference: body.reference || null,
          notes: body.notes || null,
          outstandingAfterPayment: safeDecimal(newCycleOutstanding),
        },
      })

      // Create an Expense record
      const expense = await tx.expense.create({
        data: {
          companyId,
          category: 'utility',
          description: `${bill.serviceType} - ${bill.providerName} (Bill Payment - Cycle #${cycle.cycleNumber})`,
          amount: safeDecimal(paymentAmount),
          date: new Date(body.paymentDate),
          vendor: bill.providerName,
          recurring: false,
        },
      })

      return { updatedCycle, updatedBill, payment, expense }
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
        cycleId,
        cycleNumber: cycle.cycleNumber,
        previousOutstanding: cycleOutstanding,
        newOutstanding: newCycleOutstanding,
        newCycleStatus,
        billStatus: result.updatedBill.status,
        expenseId: result.expense.id,
      },
    })

    return successResponse({
      cycle: serialize(result.updatedCycle),
      bill: serialize(result.updatedBill),
      payment: serialize(result.payment),
      expense: serialize(result.expense),
    })
  } catch (error) {
    console.error('Cycle payment error:', error)
    return errorResponse('Failed to record payment against cycle', 500)
  }
}
