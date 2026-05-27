import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const maintenance = await db.maintenance.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(maintenance)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const maintenance = await db.maintenance.create({
      data: {
        companyId: company.id,
        propertyId: body.propertyId || null,
        title: body.title,
        description: body.description,
        category: body.category || null,
        vendor: body.vendor || null,
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
        actualCost: body.actualCost ? Number(body.actualCost) : null,
        completedAt: body.status === 'completed' ? new Date() : null,
      },
    })
    return NextResponse.json(maintenance)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const maintenance = await db.maintenance.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category || null,
        vendor: body.vendor || null,
        priority: body.priority,
        status: body.status,
        estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
        actualCost: body.actualCost ? Number(body.actualCost) : null,
        propertyId: body.propertyId || null,
        completedAt: body.status === 'completed' ? new Date() : null,
      },
    })
    return NextResponse.json(maintenance)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.maintenance.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
