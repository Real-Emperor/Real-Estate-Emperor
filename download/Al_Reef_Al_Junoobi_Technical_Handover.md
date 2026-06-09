# Real Estate Emperor Property Management L.L.C.
# Property Dashboard — Technical Handover Document

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Date** | 2026-05-26 |
| **Live URL** | https://real-estate-emperor.vercel.app |
| **Deployment** | Vercel (Next.js framework) |
| **Owner** | Shafiul Azam (شفيول أعظم / শাফিউল আযম / شفیول اعظم) |

---

## Demo Credentials

| Role | Email | Password | Name |
|---|---|---|---|
| **Admin** | admin@alreef.ae | admin2024 | Ahmed Mahmoud |
| **Owner** | demoO@realestate.ae | owner123 | Shafiul Azam |
| **Staff** | demoS@realestate.ae | staff123 | Karim Hossain |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Authentication System](#4-authentication-system)
5. [Data Layer](#5-data-layer)
6. [Internationalization (i18n)](#6-internationalization-i18n)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Feature Modules](#8-feature-modules)
9. [Design System](#9-design-system)
10. [Deployment](#10-deployment)
11. [Full Source Code Reference](#11-full-source-code-reference)

---

## 1. Project Overview

Real Estate Emperor Property Management L.L.C. Property Dashboard is a comprehensive, multilingual property management application for a UAE-based real estate company. The system manages properties, tenants, rent collection, maintenance requests, expenses, financial reports, contracts, and user management.

### Key Features

- **4-Language UI Support**: English, Arabic (RTL), Bengali, Urdu (RTL) — tenant name forms use EN+AR only
- **5-Language WhatsApp Reminders**: Arabic, English, Urdu, Hindi, Bengali — with language selection popup on both Dashboard and Rent Collection pages
- **Calendar-Based Payment Tracking**: Days 1-2 = Due Soon, Days 3-4 = Unpaid, Day 5+ = Overdue
- **3-Tier RBAC**: Admin (full + User Management), Owner (full except User Mgmt), Staff (limited)
- **In-App Password Reset**: Users submit reset requests; Admin resolves from User Management
- **User Management**: Admin can add/edit/delete users, reset passwords, manage reset requests
- **WhatsApp Integration**: One-click rent reminders with UAE phone number formatting (+971)
- **Real-Time Dashboard**: Overdue alerts, payment status board, revenue trends
- **Kanban Maintenance Board**: Pending → In Progress → Completed workflow
- **P&L Reports**: Profit & Loss with 6-month trends, expense breakdowns, revenue analysis
- **Contract Tracker**: Expiring/expired contract alerts with renewal management
- **Client-Side Persistence**: All data stored in localStorage via Zustand persist
- **Islamic/Bengali Design Theme**: Emerald, gold, deep-teal color palette with geometric patterns

### Important Design Decisions

- **No backend database**: All data is stored client-side using Zustand + localStorage persistence. Data is per-browser and not shared across devices.
- **No server authentication**: Authentication is performed locally against user credentials in `data-store.ts`.
- **Tenant name form simplified**: Only English (mandatory) and Arabic (optional) name fields in the add/edit tenant dialog. Bengali and Urdu name inputs removed from form UI, though data model supports all 4 languages.
- **WhatsApp language is independent of UI language**: When sending reminders, a popup offers 5 language choices regardless of the current UI language.

---

## 2. Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **State Management** | Zustand 5 (with persist middleware) |
| **Charts** | Recharts 2.15 |
| **Icons** | Lucide React |
| **UI Components** | Full shadcn/ui component set |
| **Fonts** | Geist Sans + Geist Mono |
| **Deployment** | Vercel |
| **Package Manager** | Bun |

### Key Dependencies

```json
{
  "next": "^16.1.1",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "zustand": "^5.0.6",
  "recharts": "^2.15.4",
  "lucide-react": "^0.525.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Additional Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@radix-ui/react-*` | various | shadcn/ui primitives |
| `class-variance-authority` | ^0.7.1 | Component variant system |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^3.3.1 | Tailwind class merging |
| `sonner` | ^2.0.6 | Toast notifications |
| `date-fns` | ^4.1.0 | Date utilities |
| `react-day-picker` | ^9.8.0 | Date picker component |
| `nanoid` | ^5.1.11 | ID generation |
| `zod` | ^4.0.2 | Schema validation |
| `cmdk` | ^1.1.1 | Command palette |
| `framer-motion` | ^12.23.2 | Animations |
| `sharp` | ^0.34.3 | Image processing |

---

## 3. Architecture

### Application Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata, Toaster
│   ├── page.tsx            # Main SPA page with routing logic
│   ├── globals.css         # Tailwind + custom CSS + Islamic patterns
│   └── api/
│       └── route.ts        # Health check API endpoint
├── lib/
│   ├── types.ts            # TypeScript interfaces for all data models
│   ├── i18n.ts             # 4-language translation system + WhatsApp 5-language + helpers
│   ├── store.ts            # Auth/navigation/language Zustand store
│   ├── data-store.ts       # Business data Zustand store + user management + seed data
│   └── utils.ts            # Utility functions (formatAED, colors, etc.)
├── components/
│   ├── login.tsx           # Login page with forgot password
│   ├── sidebar.tsx         # Navigation sidebar with role-based items + reset badge
│   ├── dashboard.tsx       # Dashboard with stats, charts, payment board + WhatsApp popup
│   ├── properties.tsx      # Property CRUD with archive/sell support
│   ├── tenants.tsx         # Tenant CRUD with profile, scores, WhatsApp
│   ├── rent-collection.tsx # Rent collection with month nav + payment date + WhatsApp popup
│   ├── maintenance.tsx     # Kanban board for maintenance tasks
│   ├── expenses.tsx        # Expense tracking with category filters
│   ├── reports.tsx         # Financial reports, P&L, charts
│   ├── contracts.tsx       # Contract tracker with expiry alerts
│   └── user-management.tsx # User CRUD + password management + reset requests
└── components/ui/          # shadcn/ui component library
```

### Data Flow

```
User Action → Component → Zustand Store → localStorage (persist)
                         ↕
                    React Re-render
```

### Routing

The application is a Single Page Application (SPA) using client-side routing via Zustand state. The `currentPage` state in `store.ts` determines which component renders. There is no Next.js file-based routing beyond the root page.

The `PageType` is defined in `store.ts` as:

```ts
export type PageType = 'dashboard' | 'properties' | 'tenants' | 'rent' | 'maintenance' | 'expenses' | 'reports' | 'contracts' | 'settings'
```

The routing logic in `page.tsx` uses a `switch` statement on `currentPage`:

```ts
switch (currentPage) {
  case 'dashboard': return <Dashboard />
  case 'properties': return <Properties />
  case 'tenants': return <Tenants />
  case 'rent': return <RentCollection />
  case 'maintenance': return <Maintenance />
  case 'expenses': return isFinancialUser ? <Expenses /> : <AccessDenied />
  case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />
  case 'contracts': return <Contracts />
  case 'settings': return isSystemAdmin ? <UserManagement /> : <AccessDenied type="admin" />
  default: return <Dashboard />
}
```

---

## 4. Authentication System

### Overview

Authentication is entirely client-side. User credentials are hardcoded in `data-store.ts` as the `DEFAULT_USERS` array. There is no server-side session management or JWT tokens.

### Users (DEFAULT_USERS)

| ID | Email | Password | Name | Role |
|---|---|---|---|---|
| `user-admin` | admin@alreef.ae | admin2024 | Ahmed Mahmoud (أحمد محمود) | admin |
| `user-owner` | demoO@realestate.ae | owner123 | Shafiul Azam (شفيول أعظم) | owner |
| `user-staff` | demoS@realestate.ae | staff123 | Karim Hossain (كريم حسين) | staff |

### AuthUser Interface (store.ts)

```ts
export interface AuthUser {
  id: string
  email: string
  name: string
  nameAr?: string
  nameBn?: string
  nameUr?: string
  role: 'owner' | 'admin' | 'staff'
  companyId: string
}
```

### Auth Flow

1. User enters email + password on login page
2. `login.tsx` calls `useDataStore.getState().authenticate(email, password)`
3. The `authenticate` method finds a user with matching email and compares passwords (plaintext)
4. If matched, the user object is stored in the app store via `useAppStore.getState().login(user)`
5. Auth state is persisted in localStorage under key `realestateemperor-storage`
6. On subsequent visits, the persisted auth state is restored automatically

### Authenticate Implementation

```ts
authenticate: (email, password) => {
  const user = get().users.find(u => u.email === email)
  if (user && user.password === password) return user
  return null
}
```

### Forgot Password / In-App Reset System

Instead of email-based reset, the system uses an in-app reset request flow:

1. User clicks "Forgot Password?" on the login page
2. User fills in email, name, and optional message
3. A `ResetRequest` is created in the data store via `addResetRequest()`
4. The admin sees a badge notification on the Settings sidebar item
5. Admin navigates to User Management → Reset Requests tab
6. Admin can "Reset & Resolve" (opens password reset dialog) or "Dismiss" the request
7. When resolved, admin sets a new password for the user

### ResetRequest Interface

```ts
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
```

### Auto-Seeding

When a user logs in for the first time, if `isSeeded` is `false`, the system automatically calls `seedData()` to populate the store with sample data (4 properties, 20 tenants, 6 months of payments, 14 expenses, 7 maintenance items).

### Data Store Migration

The store includes a migration system (version 1) that:
- Ensures the admin user always exists (re-adds if missing from persisted state)
- Adds `resetRequests` array if missing from older persisted state

```ts
migrate: (persistedState: any) => {
  if (persistedState && persistedState.users) {
    const adminExists = persistedState.users.some((u: LocalUser) => u.role === 'admin')
    if (!adminExists) {
      persistedState.users = [{ id: 'user-admin', email: 'admin@alreef.ae', ... }, ...persistedState.users]
    }
  }
  if (persistedState && !persistedState.resetRequests) {
    persistedState.resetRequests = []
  }
  return persistedState
},
version: 1,
```

---

## 5. Data Layer

### Storage

All data is stored in the browser's localStorage using Zustand's `persist` middleware:

| Store | localStorage Key | Persisted Fields |
|---|---|---|
| **App Store** | `realestateemperor-storage` | `isAuthenticated`, `authUser`, `language` |
| **Data Store** | `realestateemperor-data-store` | `users`, `resetRequests`, `properties`, `tenants`, `payments`, `expenses`, `maintenanceItems`, `isSeeded` |

### LocalUser Interface (data-store.ts)

```ts
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
```

### Data Models (types.ts)

#### PropertyData

```ts
export interface PropertyData {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  nameBn: string | null
  nameUr: string | null
  type: string
  address: string | null
  totalUnits: number
  floors: number
  archived: boolean
  createdAt: string
  tenants: TenantData[]
}
```

#### TenantData

```ts
export interface TenantData {
  id: string
  companyId: string
  propertyId: string
  unitId?: string | null
  name: string
  nameAr: string | null
  nameBn: string | null
  nameUr: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  emiratesId: string | null
  nationality: string | null
  employer: string | null
  emergencyContact: string | null
  unitNumber: string | null
  unitType: string | null
  floor: number | null
  sizeSqft: number | null
  rentAmount: number
  municipalityFee: number | null
  securityDeposit: number | null
  paymentMethod: string | null
  leaseStart: string | null
  leaseEnd: string | null
  contractDuration: number | null
  renewalStatus: string | null
  newRent: number | null
  status: string
  latePaymentCount: number
  tenantScore: number
  notes: string | null
  createdAt: string
  property?: PropertyData
  payments?: PaymentData[]
}
```

#### PaymentData

```ts
export interface PaymentData {
  id: string
  tenantId: string
  amount: number
  date: string
  month: number
  year: number
  method: string | null
  reference: string | null
  receiptNumber: string | null
  notes: string | null
  isLate: boolean
  daysLate: number
  createdAt: string
  tenant?: TenantData
}
```

#### ExpenseData

```ts
export interface ExpenseData {
  id: string
  companyId: string
  category: string
  description: string
  amount: number
  date: string
  vendor: string | null
  invoiceNumber: string | null
  recurring: boolean
  building: string | null
  createdAt: string
}
```

#### MaintenanceData

```ts
export interface MaintenanceData {
  id: string
  companyId: string
  propertyId: string | null
  title: string
  description: string
  category: string | null
  vendor: string | null
  priority: string
  status: string
  estimatedCost: number | null
  actualCost: number | null
  completedAt: string | null
  createdAt: string
}
```

#### ReportData

```ts
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
  // P&L fields
  rentalIncome: number
  otherIncome: number
  grossRevenue: number
  vacancyLoss: number
  badDebt: number
  grossProfit: number
  costOfOperations: number
  netIncome: number
}
```

#### DashboardData

```ts
export interface DashboardData {
  company: {
    id: string
    name: string
    nameAr: string | null
    nameBn: string | null
    nameUr: string | null
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
    netProfit: number
    totalExpenses: number
  }
  overdueTenants: TenantData[]
  partialTenants: TenantData[]
  dueSoon: TenantData[]
  activeTenantsList: TenantData[]
  recentPayments: PaymentData[]
  chartData: { month: string; expected: number; collected: number }[]
  properties: PropertyData[]
  expenses: ExpenseData[]
  maintenanceItems: MaintenanceData[]
}
```

### CompanyInfo (data-store.ts)

```ts
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
```

Default company:

```ts
const DEFAULT_COMPANY: CompanyInfo = {
  id: 'company-1',
  name: 'Real Estate Emperor Property Management L.L.C.',
  nameAr: 'الإمبراطور العقاري لإدارة الممتلكات ذ.م.م',
  nameBn: 'রিয়েল এস্টেট এম্পেরর প্রপার্টি ম্যানেজমেন্ট এলএলসি',
  nameUr: 'املاک کا شہنشاہ',
  phone: '+971-2-555-0199',
  email: 'info@realestateemperor.ae',
  address: 'Khalifa City A, Abu Dhabi, UAE',
}
```

### CRUD Operations

All CRUD operations are through the Zustand data store:

| Entity | Operations |
|---|---|
| **Users** | `addUser`, `updateUser`, `deleteUser`, `resetUserPassword`, `generateRandomPassword` |
| **Reset Requests** | `addResetRequest`, `resolveResetRequest`, `dismissResetRequest`, `getPendingResetCount` |
| **Properties** | `addProperty`, `updateProperty`, `deleteProperty`, `archiveProperty` |
| **Tenants** | `addTenant`, `updateTenant`, `deleteTenant` |
| **Payments** | `addPayment` (also updates tenant score on late payments) |
| **Expenses** | `addExpense`, `updateExpense`, `deleteExpense` |
| **Maintenance** | `addMaintenance`, `updateMaintenance`, `deleteMaintenance` |

### Cascade Deletes

- **Property delete**: Removes the property and all associated tenants
- **Tenant delete**: Removes the tenant and all their payments

### Payment Side Effects

When a payment is added via `addPayment`, if the payment is marked as late (`isLate: true`), the tenant's score is decremented by 5 (minimum 0) and `latePaymentCount` is incremented:

```ts
addPayment: (data) => {
  // ... add payment
  const tenant = get().tenants.find(t => t.id === data.tenantId)
  if (tenant && data.isLate) {
    get().updateTenant(data.tenantId, {
      latePaymentCount: tenant.latePaymentCount + 1,
      tenantScore: Math.max(0, tenant.tenantScore - 5),
    })
  }
}
```

### Computed Getters

| Getter | Description |
|---|---|
| `getTenantsWithRelations()` | Tenants with payments and property joined |
| `getPropertiesWithTenants(includeArchived)` | Properties with active tenants |
| `getDashboardData()` | Full dashboard stats, charts, alerts |
| `getReportData(month, year)` | Financial report with P&L |

### Seed Data

The `seedData()` function populates the store with:

| Entity | Count | Details |
|---|---|---|
| Properties | 4 | Buildings A, B, C, D (3 apartments, 1 mixed-use) |
| Tenants | 20 | With diverse nationalities, unit types, scores |
| Payments | ~100+ | 6 months of payment history per active tenant |
| Expenses | 14 | Various categories with recurring/one-time flags |
| Maintenance | 7 | Mix of pending, in-progress, completed statuses |

---

## 6. Internationalization (i18n)

### UI Languages (4)

| Code | Language | Direction | Native Name |
|---|---|---|---|
| `en` | English | LTR | English |
| `ar` | Arabic | RTL | العربية |
| `bn` | Bengali | LTR | বাংলা |
| `ur` | Urdu | RTL | اردو |

### WhatsApp Message Languages (5)

| Code | Language | Native Name |
|---|---|---|
| `ar` | Arabic | العربية |
| `en` | English | English |
| `ur` | Urdu | اردو |
| `hi` | Hindi | हिन्दी |
| `bn` | Bengali | বাংলা |

The `WhatsAppLanguage` type extends `Language` with `'hi'`:

```ts
export type Language = 'en' | 'ar' | 'bn' | 'ur'
export type WhatsAppLanguage = Language | 'hi'
```

### Translation System

- All translations are in `src/lib/i18n.ts` as a single `translations` object
- Each key maps to `{ en, ar, bn, ur }` values
- The `t(key, lang)` function retrieves translations with English fallback
- RTL languages (`ar`, `ur`) automatically set `document.documentElement.dir = 'rtl'`
- All translations are academic/professional, NOT transliterations

### Language Names

```ts
export const languageNames: Record<Language, { native: string; en: string }> = {
  en: { native: 'English', en: 'English' },
  ar: { native: 'العربية', en: 'Arabic' },
  bn: { native: 'বাংলা', en: 'Bengali' },
  ur: { native: 'اردو', en: 'Urdu' },
}
```

### RTL Languages

```ts
export const rtlLanguages: Language[] = ['ar', 'ur']
```

### Key i18n Functions

| Function | Signature | Description |
|---|---|---|
| `t` | `(key: TranslationKey, lang: Language): string` | Get translation for a key |
| `getNameByLang` | `(obj, lang): string` | Get localized name from object with `name`, `nameAr`, `nameBn`, `nameUr` |
| `getMonthName` | `(month: number, lang: Language): string` | Localized month names |
| `getWhatsAppLink` | `(phone, name, amount, month, year, lang: WhatsAppLanguage): string` | Generate WhatsApp reminder URL with 5-language support |
| `getTenantScoreLabel` | `(score: number, lang: Language): string` | Score labels (Excellent/Good/Warning/Poor) |
| `getPropertyTypeLabel` | `(type: string, lang: Language): string` | Property type labels |
| `getMaintenanceCategoryLabel` | `(category: string, lang: Language): string` | Maintenance category labels |
| `getExpenseCategoryLabel` | `(category: string, lang: Language): string` | Expense category labels |

### WhatsApp Link Phone Formatting

The `getWhatsAppLink` function auto-converts phone numbers to UAE international format:
- Numbers starting with `0` → prefixed with `971`
- Numbers starting with `00` → stripped to bare country code
- Numbers without a recognized country code → assumed UAE and prefixed with `971`
- WhatsApp number priority: `tenant.whatsapp || tenant.phone`

### WhatsApp Message Template (Example - English)

```
Subject: Rent Payment Reminder
Dear {name},
This is a reminder that your monthly rent for {month} {year} in the amount of AED {amount} is currently outstanding.
Kindly arrange for payment at your earliest convenience.
Best regards,
Real Estate Emperor Property Management
```

### WhatsApp Language Selection Popup

When clicking "Remind" or "Send WhatsApp Reminder", a popup appears with 5 language buttons:

| Button Color | Language | Label |
|---|---|---|
| 🟢 Green | Arabic | العربية |
| 🔵 Blue | English | English |
| 🟦 Teal | Urdu | اردو |
| 🟠 Orange | Hindi | हिन्दी |
| 🟣 Purple | Bengali | বাংলা |

This popup is available in BOTH the Dashboard (Payment Status Board) and the Rent Collection page.

---

## 7. Role-Based Access Control (RBAC)

### Roles

| Role | Can View Financial Data | Can Access Expenses | Can Access Reports | Can Access User Management |
|---|---|---|---|---|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Owner** | ✅ | ✅ | ✅ | ❌ |
| **Staff** | ❌ | ❌ | ❌ | ❌ |

### Implementation Functions (store.ts)

```ts
export function isOwnerOrAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

export function isAdminOnly(role: string): boolean {
  return role === 'admin'
}
```

### Access Control in page.tsx

```ts
const isFinancialUser = isOwnerOrAdmin(authUser.role)
const isSystemAdmin = isAdminOnly(authUser.role)

// Expenses and Reports: only financial users (Owner/Admin)
case 'expenses': return isFinancialUser ? <Expenses /> : <AccessDenied />
case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />

// User Management (Settings): only Admin
case 'settings': return isSystemAdmin ? <UserManagement /> : <AccessDenied type="admin" />
```

### AccessDenied Component

The `AccessDenied` component displays different messages based on the `type` prop:
- `type="financial"` (default): Shows "Access Denied - Financial data is only visible to Owner/Admin" with lock icon
- `type="admin"`: Shows "User Management is only accessible by the System Administrator" with lock icon

### Staff Restrictions

- Cannot view revenue amounts on Dashboard
- Cannot view rent amounts on Payment Status Board
- Cannot access Expenses page
- Cannot access Reports page
- Cannot delete tenants
- Cannot view security deposit amounts

### Sidebar Navigation Visibility

| Page | Admin | Owner | Staff |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Properties | ✅ | ✅ | ✅ |
| Tenants | ✅ | ✅ | ✅ |
| Rent Collection | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Contracts | ✅ | ✅ | ✅ |
| Settings (User Mgmt) | ✅ | ❌ | ❌ |

### Sidebar Navigation Items Definition

```ts
const navItems: { page: PageType; icon: React.ElementType; key: string; financialOnly?: boolean; adminOnly?: boolean }[] = [
  { page: 'dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { page: 'properties', icon: Building2, key: 'properties' },
  { page: 'tenants', icon: Users, key: 'tenants' },
  { page: 'rent', icon: Banknote, key: 'rentCollection' },
  { page: 'maintenance', icon: Wrench, key: 'maintenance' },
  { page: 'expenses', icon: Receipt, key: 'expenses', financialOnly: true },
  { page: 'reports', icon: BarChart3, key: 'reports', financialOnly: true },
  { page: 'contracts', icon: FileText, key: 'contracts' },
  { page: 'settings', icon: Settings, key: 'settings', adminOnly: true },
]
```

### Reset Request Badge

The sidebar shows a notification badge on the Settings item when there are pending reset requests (only visible to Admin):

```ts
{item.page === 'settings' && pendingResetCount > 0 && isSystemAdmin && (
  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none animate-notify-pulse">
    {pendingResetCount}
  </span>
)}
```

---

## 8. Feature Modules

### 8.1 Dashboard (`dashboard.tsx`)

- Monthly overview stats: Collected Revenue, Overdue, Active Tenants, Occupancy Rate
- Overdue alert banner with count and uncollected amount
- Payment Status Board: Color-coded grid for all active tenants
  - Calendar-based status: Days 1-2 = Due Soon, Days 3-4 = Unpaid, Day 5+ = Overdue
  - WhatsApp reminder button with **language selection popup** (5 languages)
- Revenue Trend chart (6-month bar chart using Recharts)
- Recent Payments list with tenant names and methods
- "Load Sample Data" button when no data exists
- Financial data hidden from Staff users

### 8.2 Properties (`properties.tsx`)

- Property cards with name (4 languages), type, address, unit count, tenant count, occupancy
- Monthly revenue display (Owner/Admin only)
- Add/Edit dialog with 4-language name fields, type, address, units, floors
- Archive/unarchive functionality (for sold/removed buildings)
- Archived properties shown with reduced opacity and "Sold/Removed" badge
- Delete with confirmation (cascades to tenants)

### 8.3 Tenants (`tenants.tsx`)

- Searchable, filterable tenant table with avatar, score badge, status, last payment
- Expandable payment history rows
- Tenant Profile dialog with:
  - Tenant Score + Late Payments display
  - Personal Information, Contact Information, Lease Information, Financial Information
  - Full payment history with late/on-time badges
  - WhatsApp reminder button
- Add/Edit Tenant dialog:
  - **Name fields: English (mandatory) + Arabic (optional) only**
  - Contact info, personal details, property/unit, financial, lease dates, notes
  - Auto-calculated municipality fee (5% of rent)
- Delete with confirmation (cascades to payments)

### 8.4 Rent Collection (`rent-collection.tsx`)

- Month navigation with previous/next buttons
- Stats: Active Tenants, Paid, Partial, Unpaid, Overdue counts
- Collection progress bar (Owner/Admin only)
- Filter: All, Paid, Unpaid, Overdue
- **Calendar-based payment status tracking**:
  - Days 1-2 of month: Due Soon
  - Days 3-4 of month: Unpaid
  - Day 5+ of month: Overdue
  - Past months with no payment: Overdue
  - Future months: Due Soon
- Tenant payment cards with status badge and "Mark Paid" / WhatsApp reminder buttons
- **Record Payment dialog** with: amount, **payment date** (date picker), method, reference, notes
  - Payment date used to calculate isLate and daysLate automatically
- **WhatsApp Language Selection Popup**: 5 languages (Arabic, English, Urdu, Hindi, Bengali)
- "Remind All Unpaid" button opens WhatsApp for all unpaid tenants (with language popup)

### 8.5 Maintenance (`maintenance.tsx`)

- Kanban board layout: Pending → In Progress → Completed columns
- Task cards with title, description, priority badge, category, estimated/actual cost, vendor
- Quick status transitions: Start (pending → in-progress), Complete (in-progress → completed)
- Add/Edit dialog with title, description, category, vendor, priority, status, costs, property
- 7 maintenance categories: AC, Plumbing, Electrical, Lock/Door, Painting, Structural, Other

### 8.6 Expenses (`expenses.tsx`)

- **Owner/Admin only** (Staff see Access Denied)
- Monthly summary cards with category breakdowns
- Category filter buttons with icons
- Expense table with category, description, amount, date, vendor, invoice, recurring flag
- Add/Edit dialog with all expense fields
- 8 expense categories: Maintenance, Utility, Insurance, Manpower, Municipality, Leasing, Security, Other

### 8.7 Reports (`reports.tsx`)

- **Owner/Admin only** (Staff see Access Denied)
- Month navigation
- Summary cards: Revenue, Expenses, Profit/Loss, Collection Rate
- 6-Month Trend bar chart (Revenue vs Expenses)
- Expense Breakdown pie chart
- Revenue Analysis section with area chart
- Profit & Loss statement with margin indicators
- Expense Details table
- Print Report button

### 8.8 Contracts (`contracts.tsx`)

- Contract tracker for all active tenants
- Expiring (< 60 days) and expired contract alerts
- Search and filter (All, Active, Expiring, Expired)
- Contract cards with status badge, rent, dates, days until expiry

### 8.9 User Management (`user-management.tsx`) — Admin Only

- **Only accessible by Admin role** (Owner and Staff see Access Denied)
- Two tabs: Users / Reset Requests
- **Users Tab**:
  - Users table with name, email, password (masked with show/copy), role badge
  - Add User dialog with 4-language name fields, email, role (Owner/Admin/Staff), password (auto-generate option)
  - Edit User dialog with name, email, role
  - Reset Password dialog with auto-generate option
  - Delete User (cannot delete self)
  - Credentials display dialog after create/reset
  - Warning banner about secure credential sharing
- **Reset Requests Tab**:
  - Pending requests with bell icon notification
  - "Reset & Resolve" button (opens password reset for the user)
  - "Dismiss" button
  - History section for resolved/dismissed requests
- Role badges: Owner (green shield), Admin (purple shield), Staff (gray user icon)

---

## 9. Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `emerald` | #0D7C3D | Primary actions, positive indicators |
| `gold` | #C5A028 | Accent, sidebar highlights, premium feel |
| `cream` | #FFF8E7 | Background, warm paper-like feel |
| `deep-teal` | #0A5C4E | Sidebar background, headings |
| `terracotta` | #C4653A | Expenses, negative amounts |
| `bengali-green` | #006A4E | Decorative accents |
| `bengali-red` | #C1272D | Decorative accents |
| `islamic-gold` | #D4AF37 | Decorative accents |
| `deep-maroon` | #800020 | Chart colors |
| `warm-saffron` | #F4C430 | Chart colors |

### CSS Custom Properties (globals.css)

```css
:root {
  --radius: 0.625rem;
  --background: #FFF8E7;
  --foreground: #1a1a1a;
  --primary: #0D7C3D;
  --primary-foreground: #ffffff;
  --accent: #C5A028;
  --accent-foreground: #ffffff;
  --destructive: #dc2626;
  --sidebar: #0A5C4E;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #C5A028;
  --chart-1: #0D7C3D;
  --chart-2: #C5A028;
  --chart-3: #0A5C4E;
  --chart-4: #C4653A;
  --chart-5: #800020;
}
```

### CSS Special Classes

| Class | Description |
|---|---|
| `.islamic-pattern` | Geometric background pattern for sidebar (8-pointed star + arabesque lattice + nakshi kantha) |
| `.islamic-pattern-full` | Full-page geometric pattern for login (medallion + star grid + arabesque) |
| `.overdue-pulse` | Pulsing animation for overdue alerts (1.5s ease-in-out infinite) |
| `.animate-fade-in-up` | Fade in + slide up animation (0.4s ease-out) |
| `.stagger-children` | Staggered children animations (0.05s sequential delays) |
| `.custom-scrollbar` | Thin custom scrollbar (6px width) |
| `.card-hover` | Hover lift effect for cards (translateY(-2px) + shadow) |
| `.property-card-hover` | Property card specific hover (translateY(-6px) + shadow) |
| `.status-paid` | Glowing green border for paid status |
| `.status-overdue` | Glowing red border for overdue status |
| `.status-partial` | Glowing amber border for partial status |
| `.islamic-border-top` | Gold/teal repeating border top |
| `.bengali-accent` | Red-green gradient border left (Bangladesh flag inspired) |
| `.geometric-divider` | Gold/teal repeating horizontal divider |
| `.animate-skyline-float` | Floating building skyline (6s ease-in-out) |
| `.animate-gold-shimmer` | Gold shimmer text effect (3s infinite) |
| `.animate-building-rise` | Card rise with bounce (0.5s cubic-bezier) |
| `.animate-door-open` | 3D door open for dialogs (0.35s) |
| `.animate-key-turn` | Key turn animation for login (2s infinite) |
| `.animate-notify-pulse` | Notification badge pulse (2s ease-in-out infinite) |
| `.animate-page-slide` | Smooth page transition (0.3s ease-out) |
| `.animate-income-flow` | Income flow pulse for revenue numbers |

### Animations

| Animation | Duration | Effect |
|---|---|---|
| Overdue pulse | 1.5s | Opacity 1 → 0.7 → 1 |
| Fade in up | 0.4s | translateY(20px) → 0, opacity 0 → 1 |
| Stagger children | 0.05s increments | Sequential delays on child elements |
| Card hover | 0.2s | translateY(-2px) + shadow |
| Property card hover | 0.3s | translateY(-6px) + shadow (cubic-bezier bounce) |
| Notify pulse | 2s | scale(1) → 1.15 → 1 |
| Page slide | 0.3s | translateX(12px) → 0, opacity 0 → 1 |
| Gold shimmer | 3s | Background position shift (text clip) |
| Building rise | 0.5s | translateY(30px) scale(0.97) → translateY(0) scale(1) with overshoot |

### Fonts

- **Geist Sans** (variable: `--font-geist-sans`) — Primary UI font
- **Geist Mono** (variable: `--font-geist-mono`) — Code/monospace font

### Metadata

```ts
export const metadata: Metadata = {
  title: "Real Estate Emperor Property Management L.L.C.",
  description: "Property Dashboard - Real Estate Emperor Property Management L.L.C.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>",
  },
}
```

---

## 10. Deployment

### Vercel Deployment

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Node.js Version** | 18.x+ |
| **Live URL** | https://real-estate-emperor.vercel.app |

### Deployment Steps

1. Push to the connected GitHub repository (or use `npx vercel --prod`)
2. Vercel auto-detects Next.js framework
3. Build and deploy automatically

### Local Development

```bash
bun install
bun run dev
# Opens on http://localhost:3000
```

### Environment Variables

The application does **NOT** require any environment variables. All configuration is hardcoded in the source files.

### Health Check Endpoint

```
GET /api
```

Response:

```json
{ "status": "ok", "app": "Real Estate Emperor Property Management L.L.C." }
```

---

## 11. Full Source Code Reference

| File | Description |
|---|---|
| `src/app/layout.tsx` | Root layout with Geist fonts, metadata, Toaster |
| `src/app/page.tsx` | Main SPA page with routing, RTL handling, AccessDenied component |
| `src/app/globals.css` | Tailwind 4 config, Islamic/Bengali color palette, CSS animations |
| `src/app/api/route.ts` | Health check API endpoint |
| `src/lib/types.ts` | TypeScript interfaces: PageType, DashboardData, PropertyData, TenantData, PaymentData, ExpenseData, MaintenanceData, ReportData |
| `src/lib/i18n.ts` | 4-language translation system, WhatsAppLanguage type, 5-language WhatsApp messages, all helper functions |
| `src/lib/store.ts` | AuthUser interface, AppState, useAppStore (auth, navigation, language, sidebar), isOwnerOrAdmin, isAdminOnly |
| `src/lib/data-store.ts` | CompanyInfo, ResetRequest, LocalUser interfaces, DataState, DEFAULT_COMPANY, DEFAULT_USERS, seed data, all CRUD operations, computed getters, migration system |
| `src/lib/utils.ts` | cn, formatAED, formatDate, getPaymentStatusColor, getStatusColor, getPriorityColor, getMaintenanceStatusColor, getCategoryIcon, cn2 |
| `src/components/login.tsx` | Login page with Islamic pattern, language selector, forgot password form |
| `src/components/sidebar.tsx` | Navigation sidebar with role-based visibility, language cycling, reset request badge |
| `src/components/dashboard.tsx` | Dashboard with stats, payment status board (calendar-based), WhatsApp language popup, revenue chart |
| `src/components/properties.tsx` | Property CRUD with archive/sell |
| `src/components/tenants.tsx` | Tenant CRUD with profiles, scores, payment history |
| `src/components/rent-collection.tsx` | Rent collection with calendar-based status, payment date field, WhatsApp language popup |
| `src/components/maintenance.tsx` | Kanban board for maintenance |
| `src/components/expenses.tsx` | Expense tracking (Owner/Admin only) |
| `src/components/reports.tsx` | Financial reports with P&L (Owner/Admin only) |
| `src/components/contracts.tsx` | Contract tracker with expiry alerts |
| `src/components/user-management.tsx` | User CRUD, password management, reset requests (Admin only) |

---

### Utility Functions (utils.ts)

```ts
// Tailwind class merging
export function cn(...inputs: ClassValue[]): string

// Format amount as AED
export function formatAED(amount: number): string
// Example: formatAED(5000) → "5,000 AED"

// Format date for display
export function formatDate(date: string | Date): string
// Example: formatDate("2024-03-15") → "Mar 15, 2024"

// Payment status color classes
export function getPaymentStatusColor(status: 'paid' | 'overdue' | 'unpaid' | 'partial' | 'inactive' | 'due-soon'): string

// Tenant status color classes
export function getStatusColor(status: string): string

// Priority color classes
export function getPriorityColor(priority: string): string

// Maintenance status color classes
export function getMaintenanceStatusColor(status: string): string

// Category icon emoji
export function getCategoryIcon(category: string): string

// Lightweight class joiner
export function cn2(...classes: (string | boolean | undefined)[]): string
```

---

### Random Password Generator

```ts
generateRandomPassword: () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789!@#'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
```

---

### ID Generation

```ts
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
```

---

### Responsive Sidebar Behavior

The sidebar automatically adapts to screen size:
- **Desktop (≥1024px)**: Sidebar starts open (256px width), can be collapsed to icon-only (16px)
- **Mobile (<1024px)**: Sidebar starts closed, opens as overlay with backdrop
- Page content adjusts with `marginLeft` based on sidebar state
