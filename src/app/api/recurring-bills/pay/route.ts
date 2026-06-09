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

// POST /api/recurring-bills/pay — Record a payment on a recurring bill
// Uses the CYCLE's outstandingAmount as the source of truth
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

    // Get the bill with its cycles
    const bill = await prisma.recurringBill.findFirst({
      where: { id: body.recurringBillId, companyId, isActive: true, deletedAt: null },
      include: {
        cycles: {
          orderBy: { cycleNumber: 'desc' },
        },
      },
    })

    if (!bill) {
      return errorResponse('Recurring bill not found', 404)
    }

    // Find the current active cycle (pending/partially_paid/overdue)
    let currentCycle = bill.cycles.find(c =>
      c.status === 'pending' || c.status === 'partially_paid' || c.status === 'overdue'
    )

    // If no active cycle exists, create one automatically
    if (!currentCycle) {
      const lastCycle = bill.cycles[0] // highest cycleNumber (desc order)
      let periodStart = new Date()
      let periodEnd = new Date()
      let dueDate = new Date()
      const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1

      if (lastCycle) {
        periodStart = new Date(lastCycle.periodEnd)
      } else if (bill.nextDueDate) {
        periodStart = new Date(bill.nextDueDate)
      }

      periodEnd = new Date(periodStart)
      dueDate = new Date(periodStart)

      switch (bill.billingFrequency) {
        case 'monthly':
          periodEnd.setMonth(periodEnd.getMonth() + 1)
          dueDate.setMonth(dueDate.getMonth() + 1)
          break
        case 'quarterly':
          periodEnd.setMonth(periodEnd.getMonth() + 3)
          dueDate.setMonth(dueDate.getMonth() + 3)
          break
        case 'annually':
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
          dueDate.setFullYear(dueDate.getFullYear() + 1)
          break
      }

      if (bill.gracePeriodDays > 0) {
        dueDate.setDate(dueDate.getDate() + bill.gracePeriodDays)
      }

      // Create the cycle within the transaction below
      currentCycle = await prisma.billCycle.create({
        data: {
          recurringBillId: bill.id,
          companyId,
          periodStart,
          periodEnd,
          dueDate,
          amount: bill.monthlyExpectedAmount,
          paidAmount: 0,
          outstandingAmount: bill.monthlyExpectedAmount,
          status: 'pending',
          cycleNumber: nextCycleNumber,
        },
      })
    }

    // Calculate from the CYCLE's outstandingAmount — this is the source of truth
    const cycleOutstanding = Number(currentCycle.outstandingAmount)
    const cycleAmount = Number(currentCycle.amount)
    const newCycleOutstanding = Math.max(0, cycleOutstanding - paymentAmount)
    const newCyclePaid = Number(currentCycle.paidAmount) + paymentAmount

    // Derive the new cycle status
    const newCycleStatus = deriveCycleStatus(newCyclePaid, cycleAmount)

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

    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Update the cycle
      const updatedCycle = await tx.billCycle.update({
        where: { id: currentCycle!.id },
        data: {
          paidAmount: safeDecimal(newCyclePaid),
          outstandingAmount: safeDecimal(newCycleOutstanding),
          status: newCycleStatus,
        },
      })

      // Derive bill status from the latest cycle
      const latestCycle = await tx.billCycle.findFirst({
        where: { recurringBillId: bill.id },
        orderBy: { createdAt: 'desc' },
      })
      const billStatus = latestCycle?.status || newCycleStatus
      const billOutstanding = latestCycle ? Number(latestCycle.outstandingAmount) : newCycleOutstanding

      // Update the bill
      const updatedBill = await tx.recurringBill.update({
        where: { id: bill.id },
        data: {
          previousOutstandingBalance: safeDecimal(cycleOutstanding),
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
          billCycleId: currentCycle!.id,
          companyId,
          amount: safeDecimal(paymentAmount),
          paymentDate: new Date(body.paymentDate),
          method: body.method || null,
          reference: body.reference || null,
          notes: body.notes || null,
          outstandingAfterPayment: safeDecimal(newCycleOutstanding),
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

      return { updatedBill, updatedCycle, payment, expense }
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
        cycleId: currentCycle.id,
        cycleNumber: currentCycle.cycleNumber,
        previousOutstanding: cycleOutstanding,
        newOutstanding: newCycleOutstanding,
        newCycleStatus,
        billStatus: result.updatedBill.status,
        expenseId: result.expense.id,
      },
    })

    return successResponse({
      bill: serialize(result.updatedBill),
      cycle: serialize(result.updatedCycle),
      payment: serialize(result.payment),
      expense: serialize(result.expense),
    })
  } catch (error) {
    console.error('Pay recurring bill error:', error)
    return errorResponse('Failed to record payment', 500)
  }
}
