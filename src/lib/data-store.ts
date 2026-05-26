import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PropertyData, TenantData, PaymentData, ExpenseData, MaintenanceData } from '@/lib/types'

// Generate unique IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// Company info
export interface CompanyInfo {
  id: string
  name: string
  nameAr: string
  nameBn: string
  nameUr: string
  phone: string
  email: string
  address: string
}

// Reset requests from forgot password
export interface ResetRequest {
  id: string
  email: string
  name: string
  message: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
}

// Users for local auth
export interface LocalUser {
  id: string
  email: string
  password: string
  name: string
  nameAr: string
  nameBn: string
  nameUr: string
  role: 'owner' | 'admin' | 'staff'
  companyId: string
}

interface DataState {
  company: CompanyInfo
  users: LocalUser[]
  resetRequests: ResetRequest[]
  properties: PropertyData[]
  tenants: TenantData[]
  payments: PaymentData[]
  expenses: ExpenseData[]
  maintenanceItems: MaintenanceData[]
  isSeeded: boolean

  // Auth
  authenticate: (email: string, password: string) => LocalUser | null

  // User Management (Owner/Admin only)
  addUser: (data: Omit<LocalUser, 'id'>) => LocalUser
  updateUser: (id: string, data: Partial<LocalUser>) => void
  deleteUser: (id: string) => void
  resetUserPassword: (id: string, newPassword: string) => void
  generateRandomPassword: () => string

  // Reset Requests
  addResetRequest: (data: Omit<ResetRequest, 'id' | 'status' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>) => ResetRequest
  resolveResetRequest: (id: string, resolvedBy: string) => void
  dismissResetRequest: (id: string, resolvedBy: string) => void
  getPendingResetCount: () => number

  // Properties CRUD
  addProperty: (data: Omit<PropertyData, 'id' | 'companyId' | 'createdAt' | 'tenants' | 'archived'>) => void
  updateProperty: (id: string, data: Partial<PropertyData>) => void
  deleteProperty: (id: string) => void
  archiveProperty: (id: string, archived: boolean) => void

  // Tenants CRUD
  addTenant: (data: Omit<TenantData, 'id' | 'companyId' | 'createdAt' | 'payments' | 'property'>) => void
  updateTenant: (id: string, data: Partial<TenantData>) => void
  deleteTenant: (id: string) => void

  // Payments CRUD
  addPayment: (data: Omit<PaymentData, 'id' | 'createdAt' | 'tenant'>) => void

  // Expenses CRUD
  addExpense: (data: Omit<ExpenseData, 'id' | 'companyId' | 'createdAt'>) => void
  updateExpense: (id: string, data: Partial<ExpenseData>) => void
  deleteExpense: (id: string) => void

  // Maintenance CRUD
  addMaintenance: (data: Omit<MaintenanceData, 'id' | 'companyId' | 'createdAt'>) => void
  updateMaintenance: (id: string, data: Partial<MaintenanceData>) => void
  deleteMaintenance: (id: string) => void

  // Seed data
  seedData: () => void
  clearData: () => void

  // Getters - computed data
  getTenantsWithRelations: () => TenantData[]
  getPropertiesWithTenants: (includeArchived?: boolean) => PropertyData[]
  getDashboardData: () => any
  getReportData: (month: number, year: number) => any
}

const DEFAULT_COMPANY: CompanyInfo = {
  id: 'company-1',
  name: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.',
  nameAr: 'الريف الجنوبي للعقارات والصيانة العامة ذ.م.م',
  nameBn: 'আল রিফ আল জুনুবি রিয়েল এস্টেট অ্যান্ড জেনারেল মেইনটেন্যান্স এলএলসি',
  nameUr: 'الریف الجنوبی ریئل اسٹیٹ اینڈ جنرل مینٹیننس لمیٹڈ',
  phone: '+971-2-555-0199',
  email: 'info@alreefjanoubi.ae',
  address: 'Khalifa City A, Abu Dhabi, UAE',
}

const DEFAULT_USERS: LocalUser[] = [
  {
    id: 'user-owner',
    email: 'owner@alreef.ae',
    password: 'owner123',
    name: 'Shafiul Azam',
    nameAr: 'شفيول أعظم',
    nameBn: 'শাফিউল আযম',
    nameUr: 'شفیول اعظم',
    role: 'owner',
    companyId: 'company-1',
  },
  {
    id: 'user-staff',
    email: 'staff@alreef.ae',
    password: 'staff123',
    name: 'Karim Hossain',
    nameAr: 'كريم حسين',
    nameBn: 'করিম হোসেন',
    nameUr: 'کریم حسین',
    role: 'staff',
    companyId: 'company-1',
  },
]

function createSeedData() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Properties
  const properties: PropertyData[] = [
    { id: 'prop-a', companyId: 'company-1', name: 'Building A', nameAr: 'المبنى أ', nameBn: 'ভবন এ', nameUr: 'عمارت ا', type: 'apartment', address: 'Street 5, Khalifa City A, Abu Dhabi', totalUnits: 15, floors: 5, archived: false, createdAt: new Date().toISOString(), tenants: [] },
    { id: 'prop-b', companyId: 'company-1', name: 'Building B', nameAr: 'المبنى ب', nameBn: 'ভবন বি', nameUr: 'عمارت ب', type: 'apartment', address: 'Street 7, Khalifa City A, Abu Dhabi', totalUnits: 14, floors: 5, archived: false, createdAt: new Date().toISOString(), tenants: [] },
    { id: 'prop-c', companyId: 'company-1', name: 'Building C', nameAr: 'المبنى ج', nameBn: 'ভবন সি', nameUr: 'عمارت ج', type: 'apartment', address: 'Street 9, Khalifa City A, Abu Dhabi', totalUnits: 16, floors: 5, archived: false, createdAt: new Date().toISOString(), tenants: [] },
    { id: 'prop-d', companyId: 'company-1', name: 'Building D', nameAr: 'المبنى د', nameBn: 'ভবন ডি', nameUr: 'عمارت د', type: 'mixed_use', address: 'Main Road, Musaffah, Abu Dhabi', totalUnits: 10, floors: 4, archived: false, createdAt: new Date().toISOString(), tenants: [] },
  ]

  // Tenants
  const tenantsData = [
    { name: 'Muhammad Ali', nameAr: 'محمد علي', nameBn: 'মুহাম্মদ আলী', nameUr: 'محمد علی', phone: '050-588-9844', emiratesId: '784-1990-1234567-1', nationality: 'Pakistani', employer: 'Emirates NBD', unitNumber: 'A-101', unitType: 'studio', floor: 1, sizeSqft: 440, rentAmount: 2200, securityDeposit: 2200, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 95, propertyId: 'prop-a' },
    { name: 'Ahmed Khan', nameAr: 'أحمد خان', nameBn: 'আহমেদ খান', nameUr: 'احمد خان', phone: '050-501-5342', emiratesId: '784-1988-2345678-2', nationality: 'Pakistani', employer: 'Lulu Group', unitNumber: 'A-102', unitType: 'studio', floor: 1, sizeSqft: 444, rentAmount: 2267, securityDeposit: 2267, paymentMethod: 'cheque', latePaymentCount: 1, tenantScore: 85, propertyId: 'prop-a' },
    { name: 'Fatima Noor', nameAr: 'فاطمة نور', nameBn: 'ফাতিমা নূর', nameUr: 'فاطمہ نور', phone: '050-295-6577', emiratesId: '784-1995-3456789-3', nationality: 'Syrian', employer: 'Dubai Municipality', unitNumber: 'A-103', unitType: 'studio', floor: 1, sizeSqft: 448, rentAmount: 2334, securityDeposit: 2334, paymentMethod: 'bank_transfer', latePaymentCount: 2, tenantScore: 75, propertyId: 'prop-a' },
    { name: 'Rajesh Kumar', nameAr: 'راجيش كومار', nameBn: 'রাজেশ কুমার', nameUr: 'راجیش کمار', phone: '050-442-8331', emiratesId: '784-1992-4567890-4', nationality: 'Indian', employer: 'DP World', unitNumber: 'A-105', unitType: 'studio', floor: 1, sizeSqft: 456, rentAmount: 2468, securityDeposit: 2468, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 98, propertyId: 'prop-a' },
    { name: 'Priya Sharma', nameAr: 'بريا شارما', nameBn: 'প্রিয়া শর্মা', nameUr: 'پریا شرما', phone: '050-806-8816', emiratesId: '784-1993-5678901-5', nationality: 'Indian', employer: 'Al Futtaim Group', unitNumber: 'A-106', unitType: 'studio', floor: 2, sizeSqft: 460, rentAmount: 2535, securityDeposit: 2535, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 100, propertyId: 'prop-a' },
    { name: 'Omar Hassan', nameAr: 'عمر حسن', nameBn: 'ওমর হাসান', nameUr: 'عمر حسن', phone: '050-606-9838', emiratesId: '784-1991-6789012-6', nationality: 'Jordanian', employer: 'Etisalat', unitNumber: 'A-107', unitType: 'studio', floor: 2, sizeSqft: 464, rentAmount: 2602, securityDeposit: 2602, paymentMethod: 'bank_transfer', latePaymentCount: 3, tenantScore: 65, propertyId: 'prop-a' },
    { name: 'Youssef Ibrahim', nameAr: 'يوسف إبراهيم', nameBn: 'ইউসুফ ইব্রাহিম', nameUr: 'یوسف ابراہیم', phone: '050-213-2191', emiratesId: '784-1989-7890123-7', nationality: 'Egyptian', employer: 'Emirates Airline', unitNumber: 'A-110', unitType: 'studio', floor: 2, sizeSqft: 476, rentAmount: 2803, securityDeposit: 2803, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 80, propertyId: 'prop-a' },
    { name: 'Sunil Patel', nameAr: 'سونيل باتيل', nameBn: 'সুনীল পটেল', nameUr: 'سنیل پٹیل', phone: '050-538-9567', emiratesId: '784-1987-8901234-8', nationality: 'Indian', employer: 'Al Ghurair Group', unitNumber: 'A-201', unitType: '1bedroom', floor: 2, sizeSqft: 740, rentAmount: 3500, securityDeposit: 3500, paymentMethod: 'cheque', latePaymentCount: 0, tenantScore: 100, propertyId: 'prop-a' },
    { name: 'Hassan Al Farsi', nameAr: 'حسن الفارسي', nameBn: 'হাসান আল ফারসি', nameUr: 'حسن الفارسی', phone: '050-268-5177', emiratesId: '784-1985-9012345-9', nationality: 'Emirati', employer: 'ADNOC', unitNumber: 'A-203', unitType: '1bedroom', floor: 3, sizeSqft: 760, rentAmount: 3700, securityDeposit: 3700, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 100, propertyId: 'prop-a' },
    { name: 'Habibur Rahman', nameAr: 'حبيب الرحمن', nameBn: 'হাবিবুর রহমান', nameUr: 'حب الرحمن', phone: '050-217-6593', emiratesId: '784-1994-1122334-1', nationality: 'Bangladeshi', employer: 'Al Reef Maintenance', unitNumber: 'B-107', unitType: 'studio', floor: 1, sizeSqft: 460, rentAmount: 2676, securityDeposit: 2676, paymentMethod: 'cash', latePaymentCount: 2, tenantScore: 70, propertyId: 'prop-b' },
    { name: 'Rizwan Ahmed', nameAr: 'رضوان أحمد', nameBn: 'রিজওয়ান আহমেদ', nameUr: 'رضوان احمد', phone: '050-657-2469', emiratesId: '784-1996-2233445-2', nationality: 'Pakistani', employer: 'Etihad Airways', unitNumber: 'B-108', unitType: 'studio', floor: 1, sizeSqft: 465, rentAmount: 2730, securityDeposit: 2730, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 82, propertyId: 'prop-b' },
    { name: 'Amina Khatun', nameAr: 'أمينة خاتون', nameBn: 'আমিনা খাতুন', nameUr: 'امینہ خاتون', phone: '050-112-3344', emiratesId: '784-1997-3344556-3', nationality: 'Bangladeshi', employer: 'Emirates Hospital', unitNumber: 'B-201', unitType: '1bedroom', floor: 2, sizeSqft: 730, rentAmount: 3400, securityDeposit: 3400, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 100, propertyId: 'prop-b' },
    { name: 'Nasreen Akter', nameAr: 'نسرين أكتر', nameBn: 'নাসরিন আক্তার', nameUr: 'نسرین اختر', phone: '050-445-6677', emiratesId: '784-1998-4455667-4', nationality: 'Bangladeshi', employer: 'Abu Dhabi Coop', unitNumber: 'B-205', unitType: '1bedroom', floor: 2, sizeSqft: 750, rentAmount: 3600, securityDeposit: 3600, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 95, propertyId: 'prop-b' },
    { name: 'Arjun Reddy', nameAr: 'أرجون ريدي', nameBn: 'অর্জুন রেড্ডি', nameUr: 'ارجن ریڈی', phone: '050-258-2922', emiratesId: '784-1993-5566778-5', nationality: 'Indian', employer: 'Tech Solutions', unitNumber: 'C-101', unitType: 'studio', floor: 1, sizeSqft: 440, rentAmount: 2200, securityDeposit: 2200, paymentMethod: 'bank_transfer', latePaymentCount: 4, tenantScore: 55, propertyId: 'prop-c' },
    { name: 'Vikram Singh', nameAr: 'فيكرام سينغ', nameBn: 'বিক্রম সিং', nameUr: 'وکرم سنگھ', phone: '050-657-2469', emiratesId: '784-1991-6677889-6', nationality: 'Indian', employer: 'Deloitte', unitNumber: 'C-205', unitType: '1bedroom', floor: 2, sizeSqft: 750, rentAmount: 3900, securityDeposit: 3900, paymentMethod: 'cheque', latePaymentCount: 2, tenantScore: 72, propertyId: 'prop-c' },
    { name: 'Vivek Joshi', nameAr: 'فيفيك جوشي', nameBn: 'বিবেক জোশী', nameUr: 'ویویک جوشی', phone: '050-708-9988', emiratesId: '784-1990-7788990-7', nationality: 'Indian', employer: 'Mubadala', unitNumber: 'C-301', unitType: '2bedroom', floor: 3, sizeSqft: 1100, rentAmount: 5000, securityDeposit: 5000, paymentMethod: 'bank_transfer', latePaymentCount: 1, tenantScore: 85, propertyId: 'prop-c' },
    { name: 'Sanjay Verma', nameAr: 'سنجاي فيرما', nameBn: 'সঞ্জয় বর্মা', nameUr: 'سنجے ورما', phone: '050-444-9647', emiratesId: '784-1992-8899001-8', nationality: 'Indian', employer: 'Borouge', unitNumber: 'C-204', unitType: '1bedroom', floor: 2, sizeSqft: 740, rentAmount: 3813, securityDeposit: 3813, paymentMethod: 'bank_transfer', latePaymentCount: 0, tenantScore: 92, propertyId: 'prop-c' },
    { name: 'Walid Al Zaabi', nameAr: 'وليد الزعابي', nameBn: 'ওয়ালিদ আল জাবি', nameUr: 'ولید الزعابی', phone: '050-306-3183', emiratesId: '784-1988-9900112-9', nationality: 'Emirati', employer: 'AD Police', unitNumber: 'D-103', unitType: 'studio', floor: 1, sizeSqft: 445, rentAmount: 2466, securityDeposit: 2466, paymentMethod: 'cheque', latePaymentCount: 1, tenantScore: 80, propertyId: 'prop-d' },
    { name: 'Sultan Al Darmaki', nameAr: 'سلطان الدرمكي', nameBn: 'সুলতান আল দারমাকি', nameUr: 'سلطان الدارمکی', phone: '050-712-1575', emiratesId: '784-1986-0011223-0', nationality: 'Emirati', employer: 'Abu Dhabi Council', unitNumber: 'D-203', unitType: '1bedroom', floor: 2, sizeSqft: 720, rentAmount: 3966, securityDeposit: 3966, paymentMethod: 'bank_transfer', latePaymentCount: 2, tenantScore: 68, propertyId: 'prop-d' },
    { name: 'Al Madina Grocery', nameAr: 'بقالة المدينة', nameBn: 'আল মদিনা মুদি দোকান', nameUr: 'المدینہ گروسری', phone: '050-123-4567', emiratesId: '784-2000-1122334-1', nationality: 'Yemeni', employer: 'Self-employed', unitNumber: 'D-Shop1', unitType: 'shop', floor: 1, sizeSqft: 500, rentAmount: 12000, securityDeposit: 12000, paymentMethod: 'cash', latePaymentCount: 0, tenantScore: 90, propertyId: 'prop-d' },
  ]

  const tenants: TenantData[] = tenantsData.map((td, i) => ({
    id: `tenant-${i}`,
    companyId: 'company-1',
    propertyId: td.propertyId,
    name: td.name,
    nameAr: td.nameAr,
    nameBn: td.nameBn,
    nameUr: td.nameUr,
    phone: td.phone,
    whatsapp: null,
    email: null,
    emiratesId: td.emiratesId,
    nationality: td.nationality,
    employer: td.employer,
    emergencyContact: null,
    unitNumber: td.unitNumber,
    unitType: td.unitType,
    floor: td.floor,
    sizeSqft: td.sizeSqft,
    rentAmount: td.rentAmount,
    municipalityFee: Math.round(td.rentAmount * 0.05),
    securityDeposit: td.securityDeposit,
    paymentMethod: td.paymentMethod,
    leaseStart: new Date(currentYear - 1, 0, 1).toISOString(),
    leaseEnd: new Date(currentYear + 1, 11, 31).toISOString(),
    contractDuration: 24,
    renewalStatus: null,
    newRent: null,
    status: 'active',
    latePaymentCount: td.latePaymentCount,
    tenantScore: td.tenantScore,
    notes: null,
    createdAt: new Date().toISOString(),
    payments: [],
  }))

  // Payments - last 6 months
  const payments: PaymentData[] = []
  const methods = ['cash', 'bank_transfer', 'cheque']
  const overdueTenantIndices = [2, 5, 6, 9, 14] // Fatima, Omar, Youssef, Habibur, Arjun
  const partialTenantIndex = 6 // Youssef paid partial
  const previousOverdueIndices = [5, 14] // Omar, Arjun also missed last month

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    let payMonth = currentMonth - monthOffset
    let payYear = currentYear
    if (payMonth <= 0) { payMonth += 12; payYear -= 1 }

    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i]
      if (tenant.status !== 'active') continue

      // Current month: some haven't paid
      if (monthOffset === 0) {
        if (overdueTenantIndices.includes(i)) continue
        if (i === partialTenantIndex) {
          payments.push({
            id: generateId() + `-p-${i}-${monthOffset}`,
            tenantId: tenant.id,
            amount: 1682,
            date: new Date(payYear, payMonth - 1, 3).toISOString(),
            month: payMonth,
            year: payYear,
            method: 'bank_transfer',
            reference: `RCP-${payMonth}${payYear}-${tenant.unitNumber}`,
            receiptNumber: null,
            notes: null,
            isLate: false,
            daysLate: 0,
            createdAt: new Date().toISOString(),
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

      payments.push({
        id: generateId() + `-p-${i}-${monthOffset}`,
        tenantId: tenant.id,
        amount: tenant.rentAmount,
        date: new Date(payYear, payMonth - 1, isLate ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5) + 1).toISOString(),
        month: payMonth,
        year: payYear,
        method: methods[Math.floor(Math.random() * methods.length)],
        reference: `RCP-${payMonth}${payYear}-${tenant.unitNumber}`,
        receiptNumber: null,
        notes: null,
        isLate,
        daysLate,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Expenses
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

  const expenses: ExpenseData[] = expensesData.map((exp, i) => ({
    id: `expense-${i}`,
    companyId: 'company-1',
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    date: new Date(currentYear, currentMonth - 2, 15).toISOString(),
    vendor: exp.vendor,
    invoiceNumber: exp.invoiceNumber,
    recurring: exp.recurring,
    building: exp.building,
    createdAt: new Date().toISOString(),
  }))

  // Maintenance
  const maintenanceData = [
    { title: 'AC Compressor Replacement - A-107', description: 'The AC compressor has completely failed. Tenant reporting no cooling for 3 days. Needs urgent replacement.', category: 'ac', vendor: 'CoolTech Services', priority: 'urgent', status: 'in-progress', estimatedCost: 3500, actualCost: null, propertyId: 'prop-a' },
    { title: 'Water Leak - B-108', description: 'Water leaking from ceiling in unit B-108. Possible roof damage from recent rain.', category: 'plumbing', vendor: 'Al Fix Plumbing', priority: 'high', status: 'pending', estimatedCost: 2000, actualCost: null, propertyId: 'prop-b' },
    { title: 'Elevator Inspection - Building A', description: 'Annual elevator inspection and certification renewal due.', category: 'other', vendor: 'Schindler Elevators', priority: 'medium', status: 'pending', estimatedCost: 1500, actualCost: null, propertyId: 'prop-a' },
    { title: 'Parking Lot Repainting - Building D', description: 'Parking lines faded in Building D parking area. Needs repainting.', category: 'painting', vendor: 'ColorPro Painters', priority: 'low', status: 'completed', estimatedCost: 3000, actualCost: 2800, propertyId: 'prop-d' },
    { title: 'Door Lock Replacement - C-204', description: 'Tenant requested new lock installation for security reasons.', category: 'lock_door', vendor: 'KeyMaster LLC', priority: 'medium', status: 'completed', estimatedCost: 150, actualCost: 180, propertyId: 'prop-c' },
    { title: 'Intercom System Repair - Building B', description: 'Intercom system not working in Building B. Visitors cannot buzz apartments.', category: 'electrical', vendor: 'SafeWire Electric', priority: 'high', status: 'in-progress', estimatedCost: 1800, actualCost: null, propertyId: 'prop-b' },
    { title: 'Fire Extinguisher Replacement - Building A', description: 'All fire extinguishers in Building A need annual replacement.', category: 'other', vendor: 'FirePro Safety', priority: 'medium', status: 'pending', estimatedCost: 900, actualCost: null, propertyId: 'prop-a' },
  ]

  const maintenanceItems: MaintenanceData[] = maintenanceData.map((mt, i) => ({
    id: `maint-${i}`,
    companyId: 'company-1',
    propertyId: mt.propertyId,
    title: mt.title,
    description: mt.description,
    category: mt.category,
    vendor: mt.vendor,
    priority: mt.priority,
    status: mt.status,
    estimatedCost: mt.estimatedCost,
    actualCost: mt.actualCost,
    completedAt: mt.status === 'completed' ? new Date(currentYear, currentMonth - 2, 20).toISOString() : null,
    createdAt: new Date().toISOString(),
  }))

  return { properties, tenants, payments, expenses, maintenanceItems }
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      company: DEFAULT_COMPANY,
      users: DEFAULT_USERS,
      resetRequests: [],
      properties: [],
      tenants: [],
      payments: [],
      expenses: [],
      maintenanceItems: [],
      isSeeded: false,

      // Auth
      authenticate: (email, password) => {
        const user = get().users.find(u => u.email === email)
        if (user && user.password === password) return user
        return null
      },

      // User Management
      generateRandomPassword: () => {
        const chars = 'abcdefghijkmnpqrstuvwxyz23456789!@#'
        let password = ''
        for (let i = 0; i < 10; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      },

      addUser: (data) => {
        const newUser: LocalUser = {
          ...data,
          id: generateId(),
        }
        set(s => ({ users: [...s.users, newUser] }))
        return newUser
      },

      updateUser: (id, data) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
        }))
      },

      deleteUser: (id) => {
        set(s => ({
          users: s.users.filter(u => u.id !== id),
        }))
      },

      resetUserPassword: (id, newPassword) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, password: newPassword } : u),
        }))
      },

      // Reset Requests
      addResetRequest: (data) => {
        const newRequest: ResetRequest = {
          ...data,
          id: generateId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
        }
        set(s => ({ resetRequests: [...s.resetRequests, newRequest] }))
        return newRequest
      },

      resolveResetRequest: (id, resolvedBy) => {
        set(s => ({
          resetRequests: s.resetRequests.map(r =>
            r.id === id ? { ...r, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolvedBy } : r
          ),
        }))
      },

      dismissResetRequest: (id, resolvedBy) => {
        set(s => ({
          resetRequests: s.resetRequests.map(r =>
            r.id === id ? { ...r, status: 'dismissed' as const, resolvedAt: new Date().toISOString(), resolvedBy } : r
          ),
        }))
      },

      getPendingResetCount: () => {
        return get().resetRequests.filter(r => r.status === 'pending').length
      },

      // Properties CRUD
      addProperty: (data) => {
        const newProp: PropertyData = {
          ...data,
          id: generateId(),
          companyId: 'company-1',
          archived: false,
          createdAt: new Date().toISOString(),
          tenants: [],
        }
        set(s => ({ properties: [...s.properties, newProp] }))
      },

      updateProperty: (id, data) => {
        set(s => ({
          properties: s.properties.map(p => p.id === id ? { ...p, ...data } : p),
        }))
      },

      deleteProperty: (id) => {
        set(s => ({
          properties: s.properties.filter(p => p.id !== id),
          tenants: s.tenants.filter(t => t.propertyId !== id),
        }))
      },

      archiveProperty: (id, archived) => {
        set(s => ({
          properties: s.properties.map(p => p.id === id ? { ...p, archived } : p),
        }))
      },

      // Tenants CRUD
      addTenant: (data) => {
        const newTenant: TenantData = {
          ...data,
          id: generateId(),
          companyId: 'company-1',
          createdAt: new Date().toISOString(),
          payments: [],
        }
        set(s => ({ tenants: [...s.tenants, newTenant] }))
      },

      updateTenant: (id, data) => {
        set(s => ({
          tenants: s.tenants.map(t => t.id === id ? { ...t, ...data } : t),
        }))
      },

      deleteTenant: (id) => {
        set(s => ({
          tenants: s.tenants.filter(t => t.id !== id),
          payments: s.payments.filter(p => p.tenantId !== id),
        }))
      },

      // Payments
      addPayment: (data) => {
        const newPayment: PaymentData = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set(s => ({ payments: [...s.payments, newPayment] }))
        
        // Update tenant score if late
        const tenant = get().tenants.find(t => t.id === data.tenantId)
        if (tenant) {
          const isLate = data.isLate
          if (isLate) {
            get().updateTenant(data.tenantId, {
              latePaymentCount: tenant.latePaymentCount + 1,
              tenantScore: Math.max(0, tenant.tenantScore - 5),
            })
          }
        }
      },

      // Expenses CRUD
      addExpense: (data) => {
        const newExpense: ExpenseData = {
          ...data,
          id: generateId(),
          companyId: 'company-1',
          createdAt: new Date().toISOString(),
        }
        set(s => ({ expenses: [...s.expenses, newExpense] }))
      },

      updateExpense: (id, data) => {
        set(s => ({
          expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e),
        }))
      },

      deleteExpense: (id) => {
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }))
      },

      // Maintenance CRUD
      addMaintenance: (data) => {
        const newItem: MaintenanceData = {
          ...data,
          id: generateId(),
          companyId: 'company-1',
          createdAt: new Date().toISOString(),
        }
        set(s => ({ maintenanceItems: [...s.maintenanceItems, newItem] }))
      },

      updateMaintenance: (id, data) => {
        set(s => ({
          maintenanceItems: s.maintenanceItems.map(m => m.id === id ? { ...m, ...data } : m),
        }))
      },

      deleteMaintenance: (id) => {
        set(s => ({ maintenanceItems: s.maintenanceItems.filter(m => m.id !== id) }))
      },

      // Seed
      seedData: () => {
        const data = createSeedData()
        set({
          ...data,
          isSeeded: true,
        })
      },

      clearData: () => {
        set({
          properties: [],
          tenants: [],
          payments: [],
          expenses: [],
          maintenanceItems: [],
          isSeeded: false,
        })
      },

      // Getters
      getTenantsWithRelations: () => {
        const { tenants, payments, properties } = get()
        return tenants.map(tenant => ({
          ...tenant,
          payments: payments.filter(p => p.tenantId === tenant.id),
          property: properties.find(p => p.id === tenant.propertyId) || null,
        }))
      },

      getPropertiesWithTenants: (includeArchived = false) => {
        const { properties, tenants } = get()
        return properties
          .filter(p => includeArchived || !p.archived)
          .map(p => ({
            ...p,
            tenants: tenants.filter(t => t.propertyId === p.id && t.status === 'active'),
          }))
      },

      getDashboardData: () => {
        const { company, tenants, payments, properties, expenses, maintenanceItems } = get()
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const activeTenants = tenants.filter(t => t.status === 'active')
        const expectedRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)
        const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear)
        const collectedRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0)

        const overdueTenants = activeTenants.filter(t => {
          const hasPaid = payments.some(p => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear)
          return !hasPaid
        })

        const partialTenants = activeTenants.filter(t => {
          const monthPayments = payments.filter(p => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear)
          const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
          return totalPaid > 0 && totalPaid < t.rentAmount
        })

        const overdueAmount = overdueTenants.reduce((sum, t) => sum + t.rentAmount, 0)
        const partialAmount = partialTenants.reduce((sum, t) => {
          const paid = payments.filter(p => p.tenantId === t.id && p.month === currentMonth && p.year === currentYear).reduce((s, p) => s + p.amount, 0)
          return sum + (t.rentAmount - paid)
        }, 0)

        const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
        const occupiedUnits = activeTenants.length
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const chartData = []
        for (let i = 5; i >= 0; i--) {
          let m = currentMonth - i
          let y = currentYear
          if (m <= 0) { m += 12; y -= 1 }
          const monthExpected = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)
          const monthPayments = payments.filter(p => p.month === m && p.year === y)
          const monthCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0)
          chartData.push({ month: monthNames[m - 1], expected: monthExpected, collected: monthCollected })
        }

        const recentPayments = payments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
          .map(p => ({
            ...p,
            tenant: tenants.find(t => t.id === p.tenantId) || null,
          }))

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

        return {
          company,
          stats: {
            expectedRevenue,
            collectedRevenue,
            overdueCount: overdueTenants.length,
            overdueAmount: overdueAmount + partialAmount,
            activeTenants: activeTenants.length,
            totalTenants: tenants.length,
            occupancyRate,
            totalUnits,
            occupiedUnits,
            partialCount: partialTenants.length,
            netProfit: collectedRevenue - totalExpenses,
            totalExpenses,
          },
          overdueTenants: overdueTenants.map(t => ({
            ...t,
            payments: payments.filter(p => p.tenantId === t.id),
            property: properties.find(p => p.id === t.propertyId) || null,
          })),
          partialTenants: partialTenants.map(t => ({
            ...t,
            payments: payments.filter(p => p.tenantId === t.id),
            property: properties.find(p => p.id === t.propertyId) || null,
          })),
          dueSoon: [],
          activeTenantsList: activeTenants.map(t => ({
            ...t,
            payments: payments.filter(p => p.tenantId === t.id),
            property: properties.find(p => p.id === t.propertyId) || null,
          })),
          recentPayments,
          chartData,
          properties: properties.map(p => ({
            ...p,
            tenants: tenants.filter(t => t.propertyId === p.id && t.status === 'active'),
          })),
          expenses,
          maintenanceItems,
        }
      },

      getReportData: (month, year) => {
        const { tenants, payments, properties, expenses } = get()
        const activeTenants = tenants.filter(t => t.status === 'active')
        const expectedRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0)
        const monthPayments = payments.filter(p => p.month === month && p.year === year)
        const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)
        const monthlyExpenses = expenses.filter(e => {
          const d = new Date(e.date)
          return d.getMonth() + 1 === month && d.getFullYear() === year
        })
        const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)
        const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
        const occupiedUnits = activeTenants.length
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
        const collectionRate = expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0

        const expenseBreakdown: Record<string, number> = {}
        for (const e of monthlyExpenses) {
          expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount
        }

        const vacantUnits = totalUnits - occupiedUnits
        const avgRent = activeTenants.length > 0 ? expectedRevenue / activeTenants.length : 0
        const vacancyLoss = vacantUnits * avgRent

        const unpaidTenants = activeTenants.filter(t => !monthPayments.some(p => p.tenantId === t.id))
        const partialTenants = activeTenants.filter(t => {
          const paid = monthPayments.filter(p => p.tenantId === t.id).reduce((s, p) => s + p.amount, 0)
          return paid > 0 && paid < t.rentAmount
        })
        const unpaidAmount = unpaidTenants.reduce((s, t) => s + t.rentAmount, 0) + partialTenants.reduce((s, t) => {
          const paid = monthPayments.filter(p => p.tenantId === t.id).reduce((sum, p) => sum + p.amount, 0)
          return s + (t.rentAmount - paid)
        }, 0)

        // 6-month trend
        const trend = []
        for (let i = 5; i >= 0; i--) {
          let m = month - i
          let y = year
          if (m <= 0) { m += 12; y -= 1 }
          const tPayments = payments.filter(p => p.month === m && p.year === y)
          const revenue = tPayments.reduce((s, p) => s + p.amount, 0)
          const tExpenses = expenses.filter(e => {
            const d = new Date(e.date)
            return d.getMonth() + 1 === m && d.getFullYear() === y
          }).reduce((s, e) => s + e.amount, 0)
          trend.push({ month: m, year: y, revenue, expenses: tExpenses, profit: revenue - tExpenses })
        }

        const rentalIncome = totalRevenue
        const otherIncome = 0
        const grossRevenue = rentalIncome + otherIncome
        const badDebt = unpaidAmount
        const grossProfit = grossRevenue - vacancyLoss - badDebt
        const costOfOperations = totalExpenses
        const netIncome = grossProfit - costOfOperations

        return {
          month, year, totalRevenue, expectedRevenue, totalExpenses,
          profitLoss: totalRevenue - totalExpenses,
          occupancyRate, collectionRate, totalUnits, occupiedUnits,
          expenseBreakdown, monthlyExpenses, trend,
          rentalIncome, otherIncome, grossRevenue, vacancyLoss, badDebt,
          grossProfit, costOfOperations, netIncome,
        }
      },
    }),
    {
      name: 'al-reef-data-store',
      partialize: (state) => ({
        users: state.users,
        resetRequests: state.resetRequests,
        properties: state.properties,
        tenants: state.tenants,
        payments: state.payments,
        expenses: state.expenses,
        maintenanceItems: state.maintenanceItems,
        isSeeded: state.isSeeded,
      }),
    }
  )
)
