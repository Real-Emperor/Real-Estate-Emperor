export type PageType = 'dashboard' | 'properties' | 'tenants' | 'rent' | 'maintenance' | 'expenses' | 'reports'
export type Language = 'en' | 'ar'

export interface DashboardData {
  company: {
    id: string
    name: string
    nameAr: string | null
    phone: string | null
    email: string | null
    address: string | null
  } | null
  stats: {
    expectedRevenue: number
    collectedRevenue: number
    overdueCount: number
    overdueAmount: number
    activeTenants: number
    totalTenants: number
    occupancyRate: number
    totalUnits: number
    occupiedUnits: number
    partialCount: number
  }
  overdueTenants: any[]
  partialTenants: any[]
  dueSoon: any[]
  activeTenantsList: any[]
  recentPayments: any[]
  chartData: { month: string; expected: number; collected: number }[]
  properties: any[]
  expenses: any[]
  maintenanceItems: any[]
}

export interface PropertyData {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  type: string
  address: string | null
  totalUnits: number
  createdAt: string
  tenants: TenantData[]
}

export interface TenantData {
  id: string
  companyId: string
  propertyId: string
  name: string
  nameAr: string | null
  phone: string
  email: string | null
  unitNumber: string | null
  rentAmount: number
  leaseStart: string | null
  leaseEnd: string | null
  status: string
  createdAt: string
  property?: PropertyData
  payments?: PaymentData[]
}

export interface PaymentData {
  id: string
  tenantId: string
  amount: number
  date: string
  month: number
  year: number
  method: string | null
  reference: string | null
  notes: string | null
  createdAt: string
  tenant?: TenantData
}

export interface ExpenseData {
  id: string
  companyId: string
  category: string
  description: string
  amount: number
  date: string
  createdAt: string
}

export interface MaintenanceData {
  id: string
  companyId: string
  propertyId: string | null
  title: string
  description: string
  priority: string
  status: string
  cost: number | null
  createdAt: string
  completedAt: string | null
}

export interface ReportData {
  month: number
  year: number
  totalRevenue: number
  expectedRevenue: number
  totalExpenses: number
  profitLoss: number
  occupancyRate: number
  collectionRate: number
  totalUnits: number
  occupiedUnits: number
  expenseBreakdown: Record<string, number>
  monthlyExpenses: ExpenseData[]
  trend: { month: number; year: number; revenue: number; expenses: number; profit: number }[]
}
