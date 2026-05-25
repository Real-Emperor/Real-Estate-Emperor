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
        nameBn: 'আল রিফ আল জানুবি রিয়েল এস্টেট',
        nameUr: 'الریف الجنوبی ریئل اسٹیٹ',
        phone: '+971-2-555-0199',
        email: 'info@alreefjanoubi.ae',
        address: 'Khalifa City A, Abu Dhabi, UAE',
      },
    })

    // Create owner user
    await db.user.create({
      data: {
        email: 'owner@alreef.ae',
        password: 'hashed_owner123',
        name: 'Ahmed Al Janoubi',
        nameAr: 'أحمد الجنوبي',
        nameBn: 'আহমেদ আল জানুবি',
        nameUr: 'احمد الجنوبی',
        role: 'owner',
        companyId: company.id,
      },
    })

    // Create staff user
    await db.user.create({
      data: {
        email: 'staff@alreef.ae',
        password: 'hashed_staff123',
        name: 'Karim Hossain',
        nameAr: 'كريم حسين',
        nameBn: 'করিম হোসেন',
        nameUr: 'کریم حسین',
        role: 'staff',
        companyId: company.id,
      },
    })

    // Create properties
    const buildingA = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building A',
        nameAr: 'المبنى أ',
        nameBn: 'ভবন এ',
        nameUr: 'عمارت ا',
        type: 'apartment',
        address: 'Street 5, Khalifa City A, Abu Dhabi',
        totalUnits: 15,
        floors: 5,
      },
    })

    const buildingB = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building B',
        nameAr: 'المبنى ب',
        nameBn: 'ভবন বি',
        nameUr: 'عمارت ب',
        type: 'apartment',
        address: 'Street 7, Khalifa City A, Abu Dhabi',
        totalUnits: 14,
        floors: 5,
      },
    })

    const buildingC = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building C',
        nameAr: 'المبنى ج',
        nameBn: 'ভবন সি',
        nameUr: 'عمارت ج',
        type: 'apartment',
        address: 'Street 9, Khalifa City A, Abu Dhabi',
        totalUnits: 16,
        floors: 5,
      },
    })

    const buildingD = await db.property.create({
      data: {
        companyId: company.id,
        name: 'Building D',
        nameAr: 'المبنى د',
        nameBn: 'ভবন ডি',
        nameUr: 'عمارت د',
        type: 'mixed_use',
        address: 'Main Road, Musaffah, Abu Dhabi',
        totalUnits: 10,
        floors: 4,
      },
    })

    // Current date info
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Create tenants with full profile data
    const tenantsData = [
      // Building A tenants
      { name: 'Muhammad Ali', nameAr: 'محمد علي', nameBn: 'মুহাম্মদ আলী', nameUr: 'محمد علی', phone: '050-588-9844', emiratesId: '784-1990-1234567-1', nationality: 'Pakistani', employer: 'Emirates NBD', unitNumber: 'A-101', unitType: 'studio', floor: 1, sizeSqft: 440, rentAmount: 2200, securityDeposit: 2200, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 95, propertyId: buildingA.id },
      { name: 'Ahmed Khan', nameAr: 'أحمد خان', nameBn: 'আহমেদ খান', nameUr: 'احمد خان', phone: '050-501-5342', emiratesId: '784-1988-2345678-2', nationality: 'Pakistani', employer: 'Lulu Group', unitNumber: 'A-102', unitType: 'studio', floor: 1, sizeSqft: 444, rentAmount: 2267, securityDeposit: 2267, paymentMethod: 'cheque', latePaymentCount: 1, tenantScore: 85, propertyId: buildingA.id },
      { name: 'Fatima Noor', nameAr: 'فاطمة نور', nameBn: 'ফাতিমা নূর', nameUr: 'فاطمہ نور', phone: '050-295-6577', emiratesId: '784-1995-3456789-3', nationality: 'Syrian', employer: 'Dubai Municipality', unitNumber: 'A-103', unitType: 'studio', floor: 1, sizeSqft: 448, rentAmount: 2334, securityDeposit: 2334, paymentMethod: 'bank_transfer', latePaymentCount: 2, tenantScore: 75, propertyId: buildingA.id },
      { name: 'Rajesh Kumar', nameAr: 'راجيش كومار', nameBn: 'রাজেশ কুমার', nameUr: 'راجیش کمار', phone: '050-442-8331', emiratesId: '784-1992-4567890-4', nationality: 'Indian', employer: 'DP World', unitNumber: 'A-105', unitType: 'studio', floor: 1, sizeSqft: 456, rentAmount: 2468, securityDeposit: 2468, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 98, propertyId: buildingA.id },
      { name: 'Priya Sharma', nameAr: 'بريا شارما', nameBn: 'প্রিয়া শর্মা', nameUr: 'پریا شرما', phone: '050-806-8816', emiratesId: '784-1993-5678901-5', nationality: 'Indian', employer: 'Al Futtaim Group', unitNumber: 'A-106', unitType: 'studio', floor: 2, sizeSqft: 460, rentAmount: 2535, securityDeposit: 2535, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 100, propertyId: buildingA.id },
      { name: 'Omar Hassan', nameAr: 'عمر حسن', nameBn: 'ওমর হাসান', nameUr: 'عمر حسن', phone: '050-606-9838', emiratesId: '784-1991-6789012-6', nationality: 'Jordanian', employer: 'Etisalat', unitNumber: 'A-107', unitType: 'studio', floor: 2, sizeSqft: 464, rentAmount: 2602, securityDeposit: 2602, paymentMethod: 'bank_transfer', latePaymentCount: 3, tenantScore: 65, propertyId: buildingA.id },
      { name: 'Youssef Ibrahim', nameAr: 'يوسف إبراهيم', nameBn: 'ইউসুফ ইব্রাহিম', nameUr: 'یوسف ابراہیم', phone: '050-213-2191', emiratesId: '784-1989-7890123-7', nationality: 'Egyptian', employer: 'Emirates Airline', unitNumber: 'A-110', unitType: 'studio', floor: 2, sizeSqft: 476, rentAmount: 2803, securityDeposit: 2803, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 80, propertyId: buildingA.id },
      { name: 'Sunil Patel', nameAr: 'سونيل باتيل', nameBn: 'সুনীল পটেল', nameUr: 'سنیل پٹیل', phone: '050-538-9567', emiratesId: '784-1987-8901234-8', nationality: 'Indian', employer: 'Al Ghurair Group', unitNumber: 'A-201', unitType: '1bedroom', floor: 2, sizeSqft: 740, rentAmount: 3500, securityDeposit: 3500, paymentMethod: 'cheque', latePaymentCount: 0, tenantScore: 100, propertyId: buildingA.id },
      { name: 'Hassan Al Farsi', nameAr: 'حسن الفارسي', nameBn: 'হাসান আল ফারসি', nameUr: 'حسن الفارسی', phone: '050-268-5177', emiratesId: '784-1985-9012345-9', nationality: 'Emirati', employer: 'ADNOC', unitNumber: 'A-203', unitType: '1bedroom', floor: 3, sizeSqft: 760, rentAmount: 3700, securityDeposit: 3700, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 100, propertyId: buildingA.id },

      // Building B tenants
      { name: 'Habibur Rahman', nameAr: 'حبيب الرحمن', nameBn: 'হাবিবুর রহমান', nameUr: 'حب الرحمن', phone: '050-217-6593', emiratesId: '784-1994-1122334-1', nationality: 'Bangladeshi', employer: 'Al Reef Maintenance', unitNumber: 'B-107', unitType: 'studio', floor: 1, sizeSqft: 460, rentAmount: 2676, securityDeposit: 2676, paymentMethod: 'cash', latePaymentCount: 2, tenantScore: 70, propertyId: buildingB.id },
      { name: 'Rizwan Ahmed', nameAr: 'رضوان أحمد', nameBn: 'রিজওয়ান আহমেদ', nameUr: 'رضوان احمد', phone: '050-657-2469', emiratesId: '784-1996-2233445-2', nationality: 'Pakistani', employer: 'Etihad Airways', unitNumber: 'B-108', unitType: 'studio', floor: 1, sizeSqft: 465, rentAmount: 2730, securityDeposit: 2730, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 82, propertyId: buildingB.id },
      { name: 'Amina Khatun', nameAr: 'أمينة خاتون', nameBn: 'আমিনা খাতুন', nameUr: 'امینہ خاتون', phone: '050-112-3344', emiratesId: '784-1997-3344556-3', nationality: 'Bangladeshi', employer: 'Emirates Hospital', unitNumber: 'B-201', unitType: '1bedroom', floor: 2, sizeSqft: 730, rentAmount: 3400, securityDeposit: 3400, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 100, propertyId: buildingB.id },
      { name: 'Nasreen Akter', nameAr: 'نسرين أكتر', nameBn: 'নাসরিন আক্তার', nameUr: 'نسرین اختر', phone: '050-445-6677', emiratesId: '784-1998-4455667-4', nationality: 'Bangladeshi', employer: 'Abu Dhabi Coop', unitNumber: 'B-205', unitType: '1bedroom', floor: 2, sizeSqft: 750, rentAmount: 3600, securityDeposit: 3600, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 95, propertyId: buildingB.id },

      // Building C tenants
      { name: 'Arjun Reddy', nameAr: 'أرجون ريدي', nameBn: 'অর্জুন রেড্ডি', nameUr: 'ارجن ریڈی', phone: '050-258-2922', emiratesId: '784-1993-5566778-5', nationality: 'Indian', employer: 'Tech Solutions', unitNumber: 'C-101', unitType: 'studio', floor: 1, sizeSqft: 440, rentAmount: 2200, securityDeposit: 2200, paymentMethod: 'bank_transfer', latePaymentCount: 4, tenantScore: 55, propertyId: buildingC.id },
      { name: 'Vikram Singh', nameAr: 'فيكرام سينغ', nameBn: 'বিক্রম সিং', nameUr: 'وکرم سنگھ', phone: '050-657-2469', emiratesId: '784-1991-6677889-6', nationality: 'Indian', employer: 'Deloitte', unitNumber: 'C-205', unitType: '1bedroom', floor: 2, sizeSqft: 750, rentAmount: 3900, securityDeposit: 3900, paymentMethod: 'cheque', latePaymentCount: 2, tenantScore: 72, propertyId: buildingC.id },
      { name: 'Vivek Joshi', nameAr: 'فيفيك جوشي', nameBn: 'বিবেক জোশী', nameUr: 'ویویک جوشی', phone: '050-708-9988', emiratesId: '784-1990-7788990-7', nationality: 'Indian', employer: 'Mubadala', unitNumber: 'C-301', unitType: '2bedroom', floor: 3, sizeSqft: 1100, rentAmount: 5000, securityDeposit: 5000, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 85, propertyId: buildingC.id },
      { name: 'Sanjay Verma', nameAr: 'سنجاي فيرما', nameBn: 'সঞ্জয় বর্মা', nameUr: 'سنجے ورما', phone: '050-444-9647', emiratesId: '784-1992-8899001-8', nationality: 'Indian', employer: 'Borouge', unitNumber: 'C-204', unitType: '1bedroom', floor: 2, sizeSqft: 740, rentAmount: 3813, securityDeposit: 3813, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 92, propertyId: buildingC.id },

      // Building D tenants
      { name: 'Walid Al Zaabi', nameAr: 'وليد الزعابي', nameBn: 'ওয়ালিদ আল জাবি', nameUr: 'ولید الزعابی', phone: '050-306-3183', emiratesId: '784-1988-9900112-9', nationality: 'Emirati', employer: 'AD Police', unitNumber: 'D-103', unitType: 'studio', floor: 1, sizeSqft: 445, rentAmount: 2466, securityDeposit: 2466, paymentMethod: 'cheque', latePaymentCount: 1, tenantScore: 80, propertyId: buildingD.id },
      { name: 'Sultan Al Darmaki', nameAr: 'سلطان الدرمكي', nameBn: 'সুলতান আল দারমাকি', nameUr: 'سلطان الدارمکی', phone: '050-712-1575', emiratesId: '784-1986-0011223-0', nationality: 'Emirati', employer: 'Abu Dhabi Council', unitNumber: 'D-203', unitType: '1bedroom', floor: 2, sizeSqft: 720, rentAmount: 3966, securityDeposit: 3966, paymentMethod: 'bank_transfer', latePaymentCount: 2, tenantScore: 68, propertyId: buildingD.id },
      { name: 'Al Madina Grocery', nameAr: 'بقالة المدينة', nameBn: 'আল মদিনা মুদি দোকান', nameUr: 'المدینہ گروسری', phone: '050-123-4567', emiratesId: '784-2000-1122334-1', nationality: 'Yemeni', employer: 'Self-employed', unitNumber: 'D-Shop1', unitType: 'shop', floor: 1, sizeSqft: 500, rentAmount: 12000, securityDeposit: 12000, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 90, propertyId: buildingD.id },
    ]

    const tenants: any[] = []
    for (const td of tenantsData) {
      const tenant = await db.tenant.create({
        data: {
          companyId: company.id,
          propertyId: td.propertyId,
          name: td.name,
          nameAr: td.nameAr,
          nameBn: td.nameBn,
          nameUr: td.nameUr,
          phone: td.phone,
          emiratesId: td.emiratesId,
          nationality: td.nationality,
          employer: td.employer,
          unitNumber: td.unitNumber,
          unitType: td.unitType,
          floor: td.floor,
          sizeSqft: td.sizeSqft,
          rentAmount: td.rentAmount,
          municipalityFee: Math.round(td.rentAmount * 0.05),
          securityDeposit: td.securityDeposit,
          paymentMethod: td.paymentMethod,
          leaseStart: new Date(currentYear - 1, 0, 1),
          leaseEnd: new Date(currentYear + 1, 11, 31),
          contractDuration: 24,
          status: 'active',
          latePaymentCount: td.latePaymentCount,
          tenantScore: td.tenantScore,
        },
      })
      tenants.push(tenant)
    }

    // Create payments — last 6 months for active tenants
    const methods = ['cash', 'bank_transfer', 'cheque']

    // Some tenants haven't paid current month (overdue)
    const overdueTenantIndices = [2, 5, 6, 9, 14] // Fatima, Omar, Youssef, Habibur, Arjun
    const partialTenantIndex = 6 // Youssef paid partial
    const previousOverdueIndices = [5, 14] // Omar, Arjun also missed last month

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      let payMonth = currentMonth - monthOffset
      let payYear = currentYear
      if (payMonth <= 0) {
        payMonth += 12
        payYear -= 1
      }

      for (let i = 0; i < tenants.length; i++) {
        const tenant = tenants[i]
        if (tenant.status !== 'active') continue

        // Current month: some haven't paid
        if (monthOffset === 0) {
          if (overdueTenantIndices.includes(i)) continue

          // One tenant paid partial
          if (i === partialTenantIndex) {
            await db.payment.create({
              data: {
                tenantId: tenant.id,
                amount: 1682,
                date: new Date(payYear, payMonth - 1, 3),
                month: payMonth,
                year: payYear,
                method: 'bank_transfer',
                reference: `RCP-${payMonth}${payYear}-${tenant.unitNumber}`,
                isLate: false,
                daysLate: 0,
              },
            })
            continue
          }
        }

        // Last month: some missed
        if (monthOffset === 1) {
          if (previousOverdueIndices.includes(i)) continue
        }

        const isLate = monthOffset > 0 && Math.random() < 0.15
        const daysLate = isLate ? Math.floor(Math.random() * 15) + 1 : 0

        await db.payment.create({
          data: {
            tenantId: tenant.id,
            amount: tenant.rentAmount,
            date: new Date(payYear, payMonth - 1, isLate ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5) + 1),
            month: payMonth,
            year: payYear,
            method: methods[Math.floor(Math.random() * methods.length)],
            reference: `RCP-${payMonth}${payYear}-${tenant.unitNumber}`,
            isLate,
            daysLate,
          },
        })
      }
    }

    // Create expenses
    const expensesData = [
      { category: 'manpower', description: 'Building security - monthly', amount: 12000, vendor: 'SafeGuard Security', invoiceNumber: 'INV-2001', recurring: true, building: 'All Buildings' },
      { category: 'manpower', description: 'Building cleaners - monthly', amount: 8000, vendor: 'CleanPro Services', invoiceNumber: 'INV-2002', recurring: true, building: 'All Buildings' },
      { category: 'manpower', description: 'Maintenance staff - monthly', amount: 15000, vendor: 'Al Reef Maintenance', invoiceNumber: 'INV-2003', recurring: true, building: 'All Buildings' },
      { category: 'municipality', description: 'Q1 Municipality fees', amount: 9267, vendor: 'Dubai Municipality', invoiceNumber: 'MUN-0125', recurring: true, building: 'All Buildings' },
      { category: 'utilities', description: 'DEWA electricity - March', amount: 5500, vendor: 'DEWA', invoiceNumber: 'DEWA-3301', recurring: true, building: 'All Buildings' },
      { category: 'utilities', description: 'Water bill - March', amount: 3000, vendor: 'DEWA', invoiceNumber: 'DEWA-3302', recurring: true, building: 'All Buildings' },
      { category: 'maintenance', description: 'AC repair B-108', amount: 380, vendor: 'CoolTech Services', invoiceNumber: 'INV-2010', recurring: false, building: 'Building B' },
      { category: 'leasing', description: 'Leasing commission - 2 new tenants', amount: 4600, vendor: 'Al Reef Leasing', invoiceNumber: 'INV-2020', recurring: false, building: 'All Buildings' },
      { category: 'insurance', description: 'Building insurance Q2', amount: 2800, vendor: 'Oman Insurance', invoiceNumber: 'POL-4455', recurring: true, building: 'All Buildings' },
      { category: 'security', description: 'CCTV monitoring - March', amount: 6000, vendor: 'SafeGuard Security', invoiceNumber: 'INV-2004', recurring: true, building: 'All Buildings' },
      { category: 'maintenance', description: 'Elevator maintenance - Building A', amount: 1800, vendor: 'Schindler Elevators', invoiceNumber: 'INV-2030', recurring: true, building: 'Building A' },
      { category: 'maintenance', description: 'Painting - Hallway Building A', amount: 3200, vendor: 'ColorPro Painters', invoiceNumber: 'INV-2031', recurring: false, building: 'Building A' },
      { category: 'utilities', description: 'DEWA electricity - February', amount: 5200, vendor: 'DEWA', invoiceNumber: 'DEWA-3201', recurring: true, building: 'All Buildings' },
      { category: 'manpower', description: 'Building security - February', amount: 12000, vendor: 'SafeGuard Security', invoiceNumber: 'INV-2001F', recurring: true, building: 'All Buildings' },
    ]

    for (const exp of expensesData) {
      await db.expense.create({
        data: {
          companyId: company.id,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          date: new Date(currentYear, currentMonth - 2, 15),
          vendor: exp.vendor,
          invoiceNumber: exp.invoiceNumber,
          recurring: exp.recurring,
          building: exp.building,
        },
      })
    }

    // Create maintenance tasks
    const maintenanceData = [
      { title: 'AC Compressor Replacement - A-107', description: 'The AC compressor has completely failed. Tenant reporting no cooling for 3 days. Needs urgent replacement.', category: 'AC', vendor: 'CoolTech Services', priority: 'urgent', status: 'in-progress', estimatedCost: 3500, actualCost: null, propertyId: buildingA.id },
      { title: 'Water Leak - B-108', description: 'Water leaking from ceiling in unit B-108. Possible roof damage from recent rain.', category: 'Plumbing', vendor: 'Al Fix Plumbing', priority: 'high', status: 'pending', estimatedCost: 2000, actualCost: null, propertyId: buildingB.id },
      { title: 'Elevator Inspection - Building A', description: 'Annual elevator inspection and certification renewal due.', category: 'Other', vendor: 'Schindler Elevators', priority: 'medium', status: 'pending', estimatedCost: 1500, actualCost: null, propertyId: buildingA.id },
      { title: 'Parking Lot Repainting - Building D', description: 'Parking lines faded in Building D parking area. Needs repainting.', category: 'Painting', vendor: 'ColorPro Painters', priority: 'low', status: 'completed', estimatedCost: 3000, actualCost: 2800, propertyId: buildingD.id },
      { title: 'Door Lock Replacement - C-204', description: 'Tenant requested new lock installation for security reasons.', category: 'Lock/Door', vendor: 'KeyMaster LLC', priority: 'medium', status: 'completed', estimatedCost: 150, actualCost: 180, propertyId: buildingC.id },
      { title: 'Intercom System Repair - Building B', description: 'Intercom system not working in Building B. Visitors cannot buzz apartments.', category: 'Electrical', vendor: 'SafeWire Electric', priority: 'high', status: 'in-progress', estimatedCost: 1800, actualCost: null, propertyId: buildingB.id },
      { title: 'Fire Extinguisher Replacement - Building A', description: 'All fire extinguishers in Building A need annual replacement.', category: 'Other', vendor: 'FirePro Safety', priority: 'medium', status: 'pending', estimatedCost: 900, actualCost: null, propertyId: buildingA.id },
    ]

    for (const mt of maintenanceData) {
      await db.maintenance.create({
        data: {
          companyId: company.id,
          propertyId: mt.propertyId,
          title: mt.title,
          description: mt.description,
          category: mt.category,
          vendor: mt.vendor,
          priority: mt.priority,
          status: mt.status,
          estimatedCost: mt.estimatedCost,
          actualCost: mt.actualCost,
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
