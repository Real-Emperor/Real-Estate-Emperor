import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear existing data
    await db.payment.deleteMany()
    await db.maintenance.deleteMany()
    await db.expense.deleteMany()
    await db.tenant.deleteMany()
    await db.property.deleteMany()
    await db.user.deleteMany()
    await db.company.deleteMany()

    // Create company
    const company = await db.company.create({
      data: {
        name: 'Al Reef Al Janoubi Real Estate',
        nameAr: 'الريف الجنوبي للعقارات',
        phone: '+971-2-555-0199',
        email: 'info@alreefjanoubi.ae',
        address: 'Abu Dhabi, UAE',
      },
    })

    // Create owner user
    await db.user.create({
      data: {
        email: 'owner@alreefjanoubi.ae',
        password: 'hashed_password',
        name: 'Ahmed Al Janoubi',
        role: 'owner',
        companyId: company.id,
      },
    })

    // Create properties
    const buildingA = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building A',
        nameAr: 'المبنى أ',
        type: 'apartment',
        address: 'Street 5, Khalifa City A, Abu Dhabi',
        totalUnits: 12,
      },
    })

    const buildingB = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building B',
        nameAr: 'المبنى ب',
        type: 'apartment',
        address: 'Street 7, Khalifa City A, Abu Dhabi',
        totalUnits: 8,
      },
    })

    const commercialPlaza = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Commercial Plaza',
        nameAr: 'السوق التجاري',
        type: 'shop',
        address: 'Main Road, Musaffah, Abu Dhabi',
        totalUnits: 6,
      },
    })

    // Current date info
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()

    // Create tenants
    const tenantsData = [
      // Building A tenants
      { name: 'Mohammed Rahman', nameAr: 'محمد رحمن', phone: '+971501234561', unitNumber: 'Apt 101', rentAmount: 3500, propertyId: buildingA.id, status: 'active' },
      { name: 'Fatima Begum', nameAr: 'فاطمة بيغوم', phone: '+971501234562', unitNumber: 'Apt 102', rentAmount: 3500, propertyId: buildingA.id, status: 'active' },
      { name: 'Ahmed Al Mansouri', nameAr: 'أحمد المنصوري', phone: '+971501234563', unitNumber: 'Apt 201', rentAmount: 4000, propertyId: buildingA.id, status: 'active' },
      { name: 'Karim Hossain', nameAr: 'كريم حسين', phone: '+971501234564', unitNumber: 'Apt 202', rentAmount: 4000, propertyId: buildingA.id, status: 'active' },
      { name: 'Sara Al Zaabi', nameAr: 'سارة الزعابي', phone: '+971501234565', unitNumber: 'Apt 301', rentAmount: 4500, propertyId: buildingA.id, status: 'active' },
      { name: 'Rashid Islam', nameAr: 'راشد إسلام', phone: '+971501234566', unitNumber: 'Apt 302', rentAmount: 4500, propertyId: buildingA.id, status: 'active' },
      { name: 'Nasreen Akter', nameAr: 'نسرين أكتر', phone: '+971501234567', unitNumber: 'Apt 401', rentAmount: 5000, propertyId: buildingA.id, status: 'active' },
      { name: 'Omar Khalil', nameAr: 'عمر خليل', phone: '+971501234568', unitNumber: 'Apt 402', rentAmount: 5000, propertyId: buildingA.id, status: 'active' },
      { name: 'Jamal Uddin', nameAr: 'جمال الدين', phone: '+971501234569', unitNumber: 'Apt 501', rentAmount: 5500, propertyId: buildingA.id, status: 'active' },
      { name: 'Layla Al Shamsi', nameAr: 'ليلى الشمسي', phone: '+971501234570', unitNumber: 'Apt 502', rentAmount: 5500, propertyId: buildingA.id, status: 'inactive' },

      // Building B tenants
      { name: 'Habibur Rahman', nameAr: 'حبيب الرحمن', phone: '+971501234571', unitNumber: 'Apt 101', rentAmount: 3000, propertyId: buildingB.id, status: 'active' },
      { name: 'Mariam Al Ketbi', nameAr: 'مريم الكعبي', phone: '+971501234572', unitNumber: 'Apt 102', rentAmount: 3000, propertyId: buildingB.id, status: 'active' },
      { name: 'Shahid Hasan', nameAr: 'شاهيد حسن', phone: '+971501234573', unitNumber: 'Apt 201', rentAmount: 3500, propertyId: buildingB.id, status: 'active' },
      { name: 'Amina Khatun', nameAr: 'أمينة خاتون', phone: '+971501234574', unitNumber: 'Apt 202', rentAmount: 3500, propertyId: buildingB.id, status: 'active' },
      { name: 'Yousuf Al Nuaimi', nameAr: 'يوسف النعيمي', phone: '+971501234575', unitNumber: 'Apt 301', rentAmount: 4000, propertyId: buildingB.id, status: 'evicted' },

      // Commercial Plaza tenants
      { name: 'Al Madina Grocery', nameAr: 'بقالة المدينة', phone: '+971501234576', unitNumber: 'Shop 1', rentAmount: 12000, propertyId: commercialPlaza.id, status: 'active' },
      { name: 'Salam Telecom', nameAr: 'سلام للاتصالات', phone: '+971501234577', unitNumber: 'Shop 2', rentAmount: 10000, propertyId: commercialPlaza.id, status: 'active' },
      { name: 'Noor Al Khaleej Trading', nameAr: 'نور الخليج للتجارة', phone: '+971501234578', unitNumber: 'Office 1', rentAmount: 15000, propertyId: commercialPlaza.id, status: 'active' },
      { name: 'Bengal Restaurant', nameAr: 'مطعم البنغال', phone: '+971501234579', unitNumber: 'Shop 3', rentAmount: 8000, propertyId: commercialPlaza.id, status: 'active' },
    ]

    const tenants: { id: string; name: string; nameAr: string | null; phone: string; rentAmount: number; status: string; propertyId: string; unitNumber: string | null }[] = []
    for (const td of tenantsData) {
      const tenant = await db.tenant.create({
        data: {
          companyId: company.id,
          propertyId: td.propertyId,
          name: td.name,
          nameAr: td.nameAr,
          phone: td.phone,
          unitNumber: td.unitNumber,
          rentAmount: td.rentAmount,
          leaseStart: new Date(currentYear - 1, 0, 1),
          leaseEnd: new Date(currentYear + 1, 11, 31),
          status: td.status,
        },
      })
      tenants.push(tenant)
    }

    // Create payments — last 6 months for active tenants
    const methods = ['cash', 'transfer', 'cheque']
    const paymentEntries: { tenantId: string; amount: number; date: Date; month: number; year: number; method: string; reference: string }[] = []

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      let payMonth = currentMonth - monthOffset
      let payYear = currentYear
      if (payMonth <= 0) {
        payMonth += 12
        payYear -= 1
      }

      for (const tenant of tenants) {
        if (tenant.status !== 'active') continue

        // Some tenants haven't paid current month (overdue)
        if (monthOffset === 0) {
          // Current month: ~40% haven't paid yet
          const hasNotPaid = [
            tenants[2].id,  // Ahmed Al Mansouri
            tenants[5].id,  // Rashid Islam
            tenants[8].id,  // Jamal Uddin
            tenants[10].id, // Habibur Rahman
            tenants[15].id, // Al Madina Grocery
            tenants[18].id, // Bengal Restaurant
          ].includes(tenant.id)

          if (hasNotPaid) continue

          // One tenant paid partial
          if (tenant.id === tenants[3].id) {
            paymentEntries.push({
              tenantId: tenant.id,
              amount: 2000,
              date: new Date(payYear, payMonth - 1, 5),
              month: payMonth,
              year: payYear,
              method: 'cash',
              reference: `REC-${payMonth}${payYear}-${tenant.unitNumber}`,
            })
            continue
          }
        }

        // Last month: 2 haven't paid
        if (monthOffset === 1) {
          const hasNotPaid = [
            tenants[5].id,  // Rashid Islam
            tenants[18].id, // Bengal Restaurant
          ].includes(tenant.id)
          if (hasNotPaid) continue
        }

        paymentEntries.push({
          tenantId: tenant.id,
          amount: tenant.rentAmount,
          date: new Date(payYear, payMonth - 1, Math.floor(Math.random() * 10) + 1),
          month: payMonth,
          year: payYear,
          method: methods[Math.floor(Math.random() * methods.length)],
          reference: `REC-${payMonth}${payYear}-${tenant.unitNumber}`,
        })
      }
    }

    for (const pe of paymentEntries) {
      await db.payment.create({ data: pe })
    }

    // Create expenses
    const expensesData = [
      { category: 'utility', description: 'DEWA Electricity - Building A', amount: 4200, monthOffset: 0 },
      { category: 'utility', description: 'DEWA Electricity - Building B', amount: 3100, monthOffset: 0 },
      { category: 'utility', description: 'DEWA Electricity - Commercial Plaza', amount: 5800, monthOffset: 0 },
      { category: 'maintenance', description: 'AC Repair - Apt 201', amount: 1200, monthOffset: 0 },
      { category: 'maintenance', description: 'Plumbing Fix - Apt 102', amount: 800, monthOffset: 0 },
      { category: 'insurance', description: 'Property Insurance - Annual', amount: 24000, monthOffset: 1 },
      { category: 'salary', description: 'Building Security Guard', amount: 3500, monthOffset: 0 },
      { category: 'salary', description: 'Cleaner - Building A & B', amount: 2500, monthOffset: 0 },
      { category: 'maintenance', description: 'Elevator Maintenance - Building A', amount: 1800, monthOffset: 1 },
      { category: 'utility', description: 'Water Supply - All Buildings', amount: 2200, monthOffset: 1 },
      { category: 'other', description: 'Municipality Fees', amount: 1500, monthOffset: 0 },
      { category: 'maintenance', description: 'Painting - Hallway Building A', amount: 3200, monthOffset: 2 },
      { category: 'utility', description: 'DEWA Electricity - Building A', amount: 3900, monthOffset: 1 },
      { category: 'utility', description: 'DEWA Electricity - Building B', amount: 2800, monthOffset: 1 },
      { category: 'salary', description: 'Building Security Guard', amount: 3500, monthOffset: 1 },
      { category: 'salary', description: 'Cleaner - Building A & B', amount: 2500, monthOffset: 1 },
    ]

    for (const exp of expensesData) {
      const date = new Date(currentYear, currentMonth - 1 - exp.monthOffset, 15)
      await db.expense.create({
        data: {
          companyId: company.id,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          date,
        },
      })
    }

    // Create maintenance tasks
    const maintenanceData = [
      { title: 'AC Compressor Replacement - Apt 301', description: 'The AC compressor in Apt 301 has completely failed. Tenant reporting no cooling for 3 days. Needs urgent replacement.', priority: 'urgent', status: 'in-progress', cost: 3500, propertyId: buildingA.id },
      { title: 'Water Leak - Shop 3', description: 'Water leaking from ceiling in Bengal Restaurant shop. Possible roof damage.', priority: 'high', status: 'pending', cost: 2000, propertyId: commercialPlaza.id },
      { title: 'Elevator Inspection - Building A', description: 'Annual elevator inspection and certification renewal due.', priority: 'medium', status: 'pending', cost: 1500, propertyId: buildingA.id },
      { title: 'Parking Lot Repainting', description: 'Parking lines faded in Commercial Plaza parking area. Needs repainting.', priority: 'low', status: 'completed', cost: 3000, propertyId: commercialPlaza.id },
      { title: 'Door Lock Replacement - Apt 202', description: 'Tenant requested new lock installation for security reasons.', priority: 'medium', status: 'completed', cost: 450, propertyId: buildingA.id },
      { title: 'Intercom System Repair - Building B', description: 'Intercom system not working in Building B. Visitors cannot buzz apartments.', priority: 'high', status: 'in-progress', cost: 1800, propertyId: buildingB.id },
      { title: 'Fire Extinguisher Replacement', description: 'All fire extinguishers in Building A need annual replacement.', priority: 'medium', status: 'pending', cost: 900, propertyId: buildingA.id },
    ]

    for (const mt of maintenanceData) {
      await db.maintenance.create({
        data: {
          companyId: company.id,
          propertyId: mt.propertyId,
          title: mt.title,
          description: mt.description,
          priority: mt.priority,
          status: mt.status,
          cost: mt.cost,
          completedAt: mt.status === 'completed' ? new Date(currentYear, currentMonth - 2, 20) : null,
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
