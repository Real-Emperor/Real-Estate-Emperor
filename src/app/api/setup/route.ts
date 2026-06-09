import prisma from '@/lib/db'
import { checkApiRateLimit, recordApiRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// POST /api/setup — Initialize the database with company and admin user
// This endpoint is only available when no users exist in the database
export async function POST(request: Request) {
  // Production guard: block setup in production environment
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Setup is not available in production. Use the admin panel instead.' },
      { status: 403 }
    )
  }

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
    const companyName = body.companyName || 'Real Estate Emperor Property Management L.L.C.'
    const companyNameAr = body.companyNameAr || 'الإمبراطور العقاري لإدارة الممتلكات ذ.م.م'
    const companyPhone = body.companyPhone || '+971-4-555-0100'
    const companyEmail = body.companyEmail || 'info@realestateemperor.ae'
    const companyAddress = body.companyAddress || 'Business Bay, Dubai, UAE'

    const adminEmail = body.adminEmail || 'admin@realestateemperor.ae'
    const adminPassword = body.adminPassword || 'Emperor@Admin2024!'
    const adminName = body.adminName || 'Demo Admin'
    const adminNameAr = body.adminNameAr || 'مدير تجريبي'

    const ownerEmail = body.ownerEmail || 'demoO@realestate.ae'
    const ownerPassword = body.ownerPassword || 'Emperor@Owner2024!'
    const ownerName = body.ownerName || 'Demo Owner'
    const ownerNameAr = body.ownerNameAr || 'مالك تجريبي'

    const staffEmail = body.staffEmail || 'demoS@realestate.ae'
    const staffPassword = body.staffPassword || 'Emperor@Staff2024!'
    const staffName = body.staffName || 'Demo Staff'
    const staffNameAr = body.staffNameAr || 'موظف تجريبي'

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
  // Production guard: block setup status check in production
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Setup is not available in production.' },
      { status: 403 }
    )
  }

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
