import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const properties = await db.property.findMany({
      include: {
        tenants: {
          where: { status: 'active' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(properties)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const property = await db.property.create({
      data: {
        companyId: company.id,
        name: body.name,
        nameAr: body.nameAr || null,
        type: body.type,
        address: body.address || null,
        totalUnits: body.totalUnits || 1,
      },
    })
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const property = await db.property.update({
      where: { id: body.id },
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        type: body.type,
        address: body.address || null,
        totalUnits: body.totalUnits,
      },
    })
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.property.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
