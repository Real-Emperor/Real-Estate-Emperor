import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        property: true,
        payments: { orderBy: { date: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tenants)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const tenant = await db.tenant.create({
      data: {
        companyId: company.id,
        propertyId: body.propertyId,
        name: body.name,
        nameAr: body.nameAr || null,
        nameBn: body.nameBn || null,
        nameUr: body.nameUr || null,
        phone: body.phone,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        emiratesId: body.emiratesId || null,
        nationality: body.nationality || null,
        employer: body.employer || null,
        emergencyContact: body.emergencyContact || null,
        unitNumber: body.unitNumber || null,
        unitType: body.unitType || null,
        floor: body.floor ? Number(body.floor) : null,
        sizeSqft: body.sizeSqft ? Number(body.sizeSqft) : null,
        rentAmount: Number(body.rentAmount) || 0,
        municipalityFee: body.municipalityFee ? Number(body.municipalityFee) : null,
        securityDeposit: body.securityDeposit ? Number(body.securityDeposit) : null,
        paymentMethod: body.paymentMethod || null,
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contractDuration: body.contractDuration ? Number(body.contractDuration) : null,
        status: body.status || 'active',
        latePaymentCount: body.latePaymentCount ? Number(body.latePaymentCount) : 0,
        tenantScore: body.tenantScore ? Number(body.tenantScore) : 100,
        notes: body.notes || null,
      },
      include: { property: true, payments: { orderBy: { date: 'desc' } } },
    })
    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const tenant = await db.tenant.update({
      where: { id: body.id },
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        nameBn: body.nameBn || null,
        nameUr: body.nameUr || null,
        phone: body.phone,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        emiratesId: body.emiratesId || null,
        nationality: body.nationality || null,
        employer: body.employer || null,
        emergencyContact: body.emergencyContact || null,
        propertyId: body.propertyId,
        unitNumber: body.unitNumber || null,
        unitType: body.unitType || null,
        floor: body.floor ? Number(body.floor) : null,
        sizeSqft: body.sizeSqft ? Number(body.sizeSqft) : null,
        rentAmount: Number(body.rentAmount) || 0,
        municipalityFee: body.municipalityFee ? Number(body.municipalityFee) : null,
        securityDeposit: body.securityDeposit ? Number(body.securityDeposit) : null,
        paymentMethod: body.paymentMethod || null,
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        contractDuration: body.contractDuration ? Number(body.contractDuration) : null,
        status: body.status,
        latePaymentCount: body.latePaymentCount !== undefined ? Number(body.latePaymentCount) : undefined,
        tenantScore: body.tenantScore !== undefined ? Number(body.tenantScore) : undefined,
        notes: body.notes || null,
      },
      include: { property: true, payments: { orderBy: { date: 'desc' } } },
    })
    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.payment.deleteMany({ where: { tenantId: id } })
    await db.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
