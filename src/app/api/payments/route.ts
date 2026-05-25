import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const payments = await db.payment.findMany({
      include: { tenant: { include: { property: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payment = await db.payment.create({
      data: {
        tenantId: body.tenantId,
        amount: body.amount,
        date: new Date(body.date),
        month: body.month,
        year: body.year,
        method: body.method || null,
        reference: body.reference || null,
        notes: body.notes || null,
      },
      include: { tenant: true },
    })
    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const payment = await db.payment.update({
      where: { id: body.id },
      data: {
        amount: body.amount,
        date: new Date(body.date),
        month: body.month,
        year: body.year,
        method: body.method || null,
        reference: body.reference || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.payment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
