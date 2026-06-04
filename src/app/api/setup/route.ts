import prisma from '@/lib/db'
import { checkApiRateLimit, recordApiRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// POST /api/setup — Initialize the database with company and admin user
// This endpoint is only available when no users exist in the database
export async function POST(request: Request) {
  try {
    // Rate limit: max 3 setup attempts per IP per hour
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const rateKey = `setup:${ip}`
    const rateCheck = await checkApiRateLimit(rateKey, 3, 60 * 60 * 1000)
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs)
    }

    // Check if any users already exist (prevent re-running setup)
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return Response.json(
        { error: 'Database already initialized. Setup can only run once.' },
        { status: 409 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const companyName = body.companyName || 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.'
    const companyNameAr = body.companyNameAr || 'الريف الجنوبي للعقارات والصيانة العامة ذ.م.م'
    const companyPhone = body.companyPhone || '+971-2-555-0199'
    const companyEmail = body.companyEmail || 'info@alreefjanoubi.ae'
    const companyAddress = body.companyAddress || 'Khalifa City A, Abu Dhabi, UAE'

    const adminEmail = body.adminEmail || 'admin@alreef.ae'
    const adminPassword = body.adminPassword || 'admin2024'
    const adminName = body.adminName || 'Ahmed Mahmoud'
    const adminNameAr = body.adminNameAr || 'أحمد محمود'

    const ownerEmail = body.ownerEmail || 'owner@alreef.ae'
    const ownerPassword = body.ownerPassword || 'owner123'
    const ownerName = body.ownerName || 'Shafiul Azam'
    const ownerNameAr = body.ownerNameAr || 'شفيول أعظم'

    const staffEmail = body.staffEmail || 'staff@alreef.ae'
    const staffPassword = body.staffPassword || 'staff123'
    const staffName = body.staffName || 'Karim Hossain'
    const staffNameAr = body.staffNameAr || 'كريم حسين'

    // Create company
    const company = await prisma.company.create({
      data: {
        id: 'company-1',
        name: companyName,
        nameAr: companyNameAr,
        phone: companyPhone,
        email: companyEmail,
        address: companyAddress,
      },
    })

    // Hash passwords
    const [hashedAdminPwd, hashedOwnerPwd, hashedStaffPwd] = await Promise.all([
      bcrypt.hash(adminPassword, 12),
      bcrypt.hash(ownerPassword, 12),
      bcrypt.hash(staffPassword, 12),
    ])

    // Create users
    const [admin, owner, staff] = await Promise.all([
      prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedAdminPwd,
          name: adminName,
          nameAr: adminNameAr,
          role: 'admin',
          companyId: company.id,
        },
      }),
      prisma.user.create({
        data: {
          email: ownerEmail,
          password: hashedOwnerPwd,
          name: ownerName,
          nameAr: ownerNameAr,
          role: 'owner',
          companyId: company.id,
        },
      }),
      prisma.user.create({
        data: {
          email: staffEmail,
          password: hashedStaffPwd,
          name: staffName,
          nameAr: staffNameAr,
          role: 'staff',
          companyId: company.id,
        },
      }),
    ])

    // Create initial audit log
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_SETUP',
        entity: 'Company',
        entityId: company.id,
        userId: admin.id,
        companyId: company.id,
        details: JSON.stringify({
          company: companyName,
          users: [adminEmail, ownerEmail, staffEmail],
        }),
      },
    })

    // Record rate limit
    await recordApiRateLimit(rateKey, 3, 60 * 60 * 1000)

    return Response.json({
      success: true,
      message: 'Database initialized successfully!',
      company: { id: company.id, name: company.name },
      users: [
        { email: adminEmail, role: 'admin', name: adminName },
        { email: ownerEmail, role: 'owner', name: ownerName },
        { email: staffEmail, role: 'staff', name: staffName },
      ],
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return Response.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/setup — Check if database needs setup
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const companyCount = await prisma.company.count()

    return Response.json({
      needsSetup: userCount === 0,
      userCount,
      companyCount,
      status: userCount === 0 ? 'NOT_INITIALIZED' : 'READY',
    })
  } catch (error: any) {
    // If the database tables don't exist yet, Prisma will throw an error
    return Response.json({
      needsSetup: true,
      error: error.message,
      status: 'DATABASE_ERROR',
      hint: 'Run migrations first: npx prisma migrate deploy',
    }, { status: 500 })
  }
}
