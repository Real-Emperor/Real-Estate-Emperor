import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const properties = await db.property.findMany({
      where: includeArchived ? {} : { archived: false },
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
        nameBn: body.nameBn || null,
        nameUr: body.nameUr || null,
        type: body.type,
        address: body.address || null,
        totalUnits: body.totalUnits || 1,
        floors: body.floors || 1,
        archived: body.archived || false,
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
    const data: Record<string, unknown> = {
      name: body.name,
      nameAr: body.nameAr || null,
      nameBn: body.nameBn || null,
      nameUr: body.nameUr || null,
      type: body.type,
      address: body.address || null,
      totalUnits: body.totalUnits,
      floors: body.floors,
    }
    if (body.archived !== undefined) {
      data.archived = body.archived
    }

    const property = await db.property.update({
      where: { id: body.id },
      data,
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
