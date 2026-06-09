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

// PUT /api/recurring-bills/payments/[paymentId] — Edit a payment
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { paymentId } = await params
    const companyId = user.companyId
    const body = await request.json()

    // Get the existing payment
    const existingPayment = await prisma.recurringBillPayment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        billCycle: true,
        recurringBill: {
          include: {
            cycles: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (!existingPayment) {
      return errorResponse('Payment not found', 404)
    }

    const oldAmount = Number(existingPayment.amount)
    const newAmount = safeDecimal(body.amount !== undefined ? body.amount : oldAmount)
    const amountDiff = newAmount - oldAmount

    // Build update data for payment
    const paymentUpdateData: any = {}
    if (body.amount !== undefined) paymentUpdateData.amount = safeDecimal(body.amount)
    if (body.paymentDate !== undefined) paymentUpdateData.paymentDate = new Date(body.paymentDate)
    if (body.method !== undefined) paymentUpdateData.method = body.method || null
    if (body.reference !== undefined) paymentUpdateData.reference = body.reference || null
    if (body.notes !== undefined) paymentUpdateData.notes = body.notes || null

    const cycleId = existingPayment.billCycleId
    const bill = existingPayment.recurringBill

    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Update the payment
      const updatedPayment = await tx.recurringBillPayment.update({
        where: { id: paymentId },
        data: paymentUpdateData,
      })

      // If the payment is linked to a cycle, recalculate the cycle
      if (cycleId) {
        const cycle = await tx.billCycle.findUnique({
          where: { id: cycleId },
        })

        if (cycle) {
          // Sum all payments for this cycle
          const cyclePayments = await tx.recurringBillPayment.findMany({
            where: { billCycleId: cycleId },
          })
          const totalPaid = cyclePayments.reduce((sum, p) => sum + Number(p.amount), 0)
          const cycleAmount = Number(cycle.amount)
          const outstandingAmount = Math.max(0, cycleAmount - totalPaid)
          const cycleStatus = deriveCycleStatus(totalPaid, cycleAmount)

          await tx.billCycle.update({
            where: { id: cycleId },
            data: {
              paidAmount: safeDecimal(totalPaid),
              outstandingAmount: safeDecimal(outstandingAmount),
              status: cycleStatus,
            },
          })

          // Update the outstandingAfterPayment for all payments in this cycle
          // Recalculate from newest to oldest
          const sortedPayments = cyclePayments.sort(
            (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          )
          let runningOutstanding = outstandingAmount
          for (const p of sortedPayments) {
            await tx.recurringBillPayment.update({
              where: { id: p.id },
              data: { outstandingAfterPayment: safeDecimal(runningOutstanding) },
            })
            runningOutstanding = Math.max(0, runningOutstanding - Number(p.amount))
          }

          // Get the latest cycle for the bill
          const latestCycle = await tx.billCycle.findFirst({
            where: { recurringBillId: bill.id },
            orderBy: { createdAt: 'desc' },
          })

          // Update the parent bill
          const latestCycleStatus = latestCycle?.status || bill.status
          const latestOutstanding = latestCycle ? Number(latestCycle.outstandingAmount) : Number(bill.currentOutstandingBalance)

          await tx.recurringBill.update({
            where: { id: bill.id },
            data: {
              currentOutstandingBalance: safeDecimal(latestOutstanding),
              status: latestCycleStatus,
              lastPaymentAmount: safeDecimal(newAmount),
              lastPaymentDate: body.paymentDate ? new Date(body.paymentDate) : existingPayment.paymentDate,
              totalAmountDue: safeDecimal(latestOutstanding + Number(bill.monthlyExpectedAmount)),
            },
          })
        }
      } else {
        // No cycle linked — update bill-level fields directly
        const newOutstanding = Number(bill.currentOutstandingBalance) - amountDiff
        const clampedOutstanding = Math.max(0, newOutstanding)
        const billStatus = deriveCycleStatus(Number(bill.monthlyExpectedAmount) - clampedOutstanding, Number(bill.monthlyExpectedAmount))

        await tx.recurringBill.update({
          where: { id: bill.id },
          data: {
            currentOutstandingBalance: safeDecimal(clampedOutstanding),
            status: billStatus,
            lastPaymentAmount: safeDecimal(newAmount),
            lastPaymentDate: body.paymentDate ? new Date(body.paymentDate) : existingPayment.paymentDate,
            totalAmountDue: safeDecimal(clampedOutstanding + Number(bill.monthlyExpectedAmount)),
          },
        })

        // Update the payment's outstandingAfterPayment
        await tx.recurringBillPayment.update({
          where: { id: paymentId },
          data: { outstandingAfterPayment: safeDecimal(clampedOutstanding) },
        })
      }

      // Update the linked Expense record if amount changed
      if (amountDiff !== 0) {
        await tx.expense.updateMany({
          where: {
            companyId,
            category: 'utility',
            vendor: bill.providerName,
            amount: safeDecimal(oldAmount),
            recurring: false,
          },
          data: {
            amount: safeDecimal(newAmount),
          },
        })
      }

      return updatedPayment
    })

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'RecurringBillPayment',
      entityId: paymentId,
      userId: user.id,
      companyId,
      details: {
        billId: bill.id,
        providerName: bill.providerName,
        oldAmount,
        newAmount: Number(newAmount),
        cycleId,
      },
    })

    return successResponse(serialize(result))
  } catch (error) {
    console.error('Edit payment error:', error)
    return errorResponse('Failed to edit payment', 500)
  }
}

// DELETE /api/recurring-bills/payments/[paymentId] — Delete a payment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { paymentId } = await params
    const companyId = user.companyId

    // Get the existing payment
    const existingPayment = await prisma.recurringBillPayment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        billCycle: true,
        recurringBill: true,
      },
    })

    if (!existingPayment) {
      return errorResponse('Payment not found', 404)
    }

    const deletedAmount = Number(existingPayment.amount)
    const cycleId = existingPayment.billCycleId
    const bill = existingPayment.recurringBill

    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Store payment data before deletion for response
      const paymentData = serialize(existingPayment)

      // Delete the payment
      await tx.recurringBillPayment.delete({
        where: { id: paymentId },
      })

      // If the payment was linked to a cycle, recalculate the cycle
      if (cycleId) {
        const cycle = await tx.billCycle.findUnique({
          where: { id: cycleId },
        })

        if (cycle) {
          // Sum remaining payments for this cycle
          const cyclePayments = await tx.recurringBillPayment.findMany({
            where: { billCycleId: cycleId },
          })
          const totalPaid = cyclePayments.reduce((sum, p) => sum + Number(p.amount), 0)
          const cycleAmount = Number(cycle.amount)
          const outstandingAmount = Math.max(0, cycleAmount - totalPaid)
          const cycleStatus = deriveCycleStatus(totalPaid, cycleAmount)

          await tx.billCycle.update({
            where: { id: cycleId },
            data: {
              paidAmount: safeDecimal(totalPaid),
              outstandingAmount: safeDecimal(outstandingAmount),
              status: cycleStatus,
            },
          })

          // Update outstandingAfterPayment for remaining payments in this cycle
          const sortedPayments = cyclePayments.sort(
            (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          )
          let runningOutstanding = outstandingAmount
          for (const p of sortedPayments) {
            await tx.recurringBillPayment.update({
              where: { id: p.id },
              data: { outstandingAfterPayment: safeDecimal(runningOutstanding) },
            })
            runningOutstanding = Math.max(0, runningOutstanding - Number(p.amount))
          }

          // Get the latest cycle for the bill
          const latestCycle = await tx.billCycle.findFirst({
            where: { recurringBillId: bill.id },
            orderBy: { createdAt: 'desc' },
          })

          // Update the parent bill
          const latestCycleStatus = latestCycle?.status || bill.status
          const latestOutstanding = latestCycle ? Number(latestCycle.outstandingAmount) : Number(bill.currentOutstandingBalance)

          // Get the latest payment for the bill
          const latestPayment = await tx.recurringBillPayment.findFirst({
            where: { recurringBillId: bill.id },
            orderBy: { paymentDate: 'desc' },
          })

          await tx.recurringBill.update({
            where: { id: bill.id },
            data: {
              currentOutstandingBalance: safeDecimal(latestOutstanding),
              status: latestCycleStatus,
              lastPaymentAmount: latestPayment ? safeDecimal(Number(latestPayment.amount)) : null,
              lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
              totalAmountDue: safeDecimal(latestOutstanding + Number(bill.monthlyExpectedAmount)),
            },
          })
        }
      } else {
        // No cycle linked — update bill-level fields directly
        const newOutstanding = Number(bill.currentOutstandingBalance) + deletedAmount
        const billStatus = deriveCycleStatus(
          Number(bill.monthlyExpectedAmount) - newOutstanding,
          Number(bill.monthlyExpectedAmount)
        )

        // Get the latest payment for the bill
        const latestPayment = await tx.recurringBillPayment.findFirst({
          where: { recurringBillId: bill.id },
          orderBy: { paymentDate: 'desc' },
        })

        await tx.recurringBill.update({
          where: { id: bill.id },
          data: {
            currentOutstandingBalance: safeDecimal(Math.max(0, newOutstanding)),
            status: billStatus,
            lastPaymentAmount: latestPayment ? safeDecimal(Number(latestPayment.amount)) : null,
            lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
            totalAmountDue: safeDecimal(Math.max(0, newOutstanding) + Number(bill.monthlyExpectedAmount)),
          },
        })
      }

      // Delete the linked Expense record
      await tx.expense.deleteMany({
        where: {
          companyId,
          category: 'utility',
          vendor: bill.providerName,
          amount: safeDecimal(deletedAmount),
          recurring: false,
        },
      })

      return paymentData
    })

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entity: 'RecurringBillPayment',
      entityId: paymentId,
      userId: user.id,
      companyId,
      details: {
        billId: bill.id,
        providerName: bill.providerName,
        deletedAmount,
        cycleId,
      },
    })

    return successResponse(result)
  } catch (error) {
    console.error('Delete payment error:', error)
    return errorResponse('Failed to delete payment', 500)
  }
}
