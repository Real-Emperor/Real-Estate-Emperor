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

// POST /api/recurring-bills/[id]/advance-cycle — Create a new billing cycle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const companyId = user.companyId
    const body = await request.json()

    // Get the bill
    const bill = await prisma.recurringBill.findFirst({
      where: { id, companyId, isActive: true, deletedAt: null },
      include: {
        cycles: {
          orderBy: { cycleNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!bill) {
      return errorResponse('Recurring bill not found', 404)
    }

    // The new cycle amount — can be different from monthlyExpectedAmount
    const newAmount = body.amount ? safeDecimal(body.amount) : bill.monthlyExpectedAmount

    // Calculate period dates based on billing frequency
    const lastCycle = bill.cycles[0]
    let periodStart: Date
    let periodEnd: Date
    let dueDate: Date

    if (lastCycle) {
      // Start from end of last cycle
      periodStart = new Date(lastCycle.periodEnd)
    } else if (bill.nextDueDate) {
      periodStart = new Date(bill.nextDueDate)
    } else {
      periodStart = new Date()
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

    // Apply grace period to due date
    if (bill.gracePeriodDays > 0) {
      dueDate.setDate(dueDate.getDate() + bill.gracePeriodDays)
    }

    // Determine next cycle number
    const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1

    // Create the new cycle and update the bill in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the new cycle
      const newCycle = await tx.billCycle.create({
        data: {
          recurringBillId: bill.id,
          companyId,
          periodStart,
          periodEnd,
          dueDate,
          amount: newAmount,
          paidAmount: 0,
          outstandingAmount: newAmount,
          status: 'pending',
          cycleNumber: nextCycleNumber,
        },
      })

      // Update the bill's nextDueDate and monthlyExpectedAmount
      const updatedBill = await tx.recurringBill.update({
        where: { id: bill.id },
        data: {
          nextDueDate: dueDate,
          monthlyExpectedAmount: newAmount,
          totalAmountDue: newAmount + Number(bill.currentOutstandingBalance),
        },
        include: {
          property: {
            select: { id: true, name: true },
          },
          cycles: {
            orderBy: { cycleNumber: 'desc' },
          },
        },
      })

      return { newCycle, updatedBill }
    })

    // Create audit log
    await createAuditLog({
      action: 'ADVANCE_CYCLE',
      entity: 'RecurringBill',
      entityId: id,
      userId: user.id,
      companyId,
      details: {
        providerName: bill.providerName,
        serviceType: bill.serviceType,
        newCycleNumber: nextCycleNumber,
        newAmount: Number(newAmount),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dueDate: dueDate.toISOString(),
      },
    })

    return successResponse({
      cycle: serialize(result.newCycle),
      bill: serialize(result.updatedBill),
    })
  } catch (error) {
    console.error('Advance cycle error:', error)
    return errorResponse('Failed to advance billing cycle', 500)
  }
}
