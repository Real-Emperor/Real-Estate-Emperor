import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const expense = await db.expense.create({
      data: {
        companyId: company.id,
        category: body.category,
        description: body.description,
        amount: body.amount,
        date: new Date(body.date),
      },
    })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const expense = await db.expense.update({
      where: { id: body.id },
      data: {
        category: body.category,
        description: body.description,
        amount: body.amount,
        date: new Date(body.date),
      },
    })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
