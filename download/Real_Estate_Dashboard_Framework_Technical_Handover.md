# Real Estate Property Dashboard — Reusable Framework Template
# Technical Handover Document

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Date** | 2026-05-26 |
| **Framework Name** | Property Dashboard Framework (PDF) |
| **Template Origin** | Real Estate Emperor Property Management L.L.C. |
| **Owner** | Shafiul Azam |

> **Purpose**: This document is the definitive, reusable technical blueprint for spinning up a new real estate property dashboard for any client. Everything in this framework is identical to the Real Estate Emperor project — only the items marked with `{{PLACEHOLDER}}` need to be customized per client. When you get a new client, simply replace all placeholders and deploy.

---

## Quick-Start: What You Need From the Client

Before spinning up a new instance, collect the following from the client:

| # | Information Needed | Where It Goes | Example |
|---|---|---|---|
| 1 | **Company Name** (English) | `DEFAULT_COMPANY.name`, `metadata.title`, `loginSubtitle` translation | "Real Estate Emperor Property Management L.L.C." |
| 2 | **Company Name** (Arabic) | `DEFAULT_COMPANY.nameAr`, Arabic `loginSubtitle` translation | "الإمبراطور العقاري لإدارة الممتلكات ذ.م.م" |
| 3 | **Company Name** (Bengali) | `DEFAULT_COMPANY.nameBn`, Bengali `loginSubtitle` translation | "রিয়েল এস্টেট এম্পেরর প্রপার্টি ম্যানেজমেন্ট এলএলসি" |
| 4 | **Company Name** (Urdu) | `DEFAULT_COMPANY.nameUr`, Urdu `loginSubtitle` translation | "املاک کا شہنشاہ" |
| 5 | **Company Phone** | `DEFAULT_COMPANY.phone` | "+971-2-555-0199" |
| 6 | **Company Email** | `DEFAULT_COMPANY.email` | "info@realestateemperor.ae" |
| 7 | **Company Address** | `DEFAULT_COMPANY.address` | "Khalifa City A, Abu Dhabi, UAE" |
| 8 | **Primary Color** (brand/emerald) | CSS `--primary`, `--color-emerald` | "#0D7C3D" |
| 9 | **Accent Color** (gold) | CSS `--accent`, `--color-gold` | "#C5A028" |
| 10 | **Sidebar Background Color** (deep-teal) | CSS `--sidebar`, `--color-deep-teal` | "#0A5C4E" |
| 11 | **Background Color** (cream) | CSS `--background`, `--color-cream` | "#FFF8E7" |
| 12 | **Favicon Emoji** | `metadata.icons.icon` | "🌙" |
| 13 | **Sidebar Logo Icon** | Sidebar logo Lucide icon | `Moon` |
| 14 | **Default Admin Name** | `DEFAULT_USERS[0]` name fields | "Ahmed Mahmoud" |
| 15 | **Default Admin Email** | `DEFAULT_USERS[0].email` | "admin@alreef.ae" |
| 16 | **Default Admin Password** | `DEFAULT_USERS[0].password` | "admin2024" |
| 17 | **Default Owner Name** | `DEFAULT_USERS[1]` name fields | "Shafiul Azam" |
| 18 | **Default Owner Email** | `DEFAULT_USERS[1].email` | "demoO@realestate.ae" |
| 19 | **Default Owner Password** | `DEFAULT_USERS[1].password` | "owner123" |
| 20 | **Vercel Project Name** | Vercel deployment slug | "real-estate-emperor" |
| 21 | **Domain/Subdomain** | Vercel custom domain | "real-estate-emperor.vercel.app" |
| 22 | **WhatsApp Country Code** | `getWhatsAppLink` phone formatting | "+971" (UAE) |
| 23 | **Currency Format** | `formatAED` function | "AED" (UAE Dirham) |
| 24 | **Municipality Fee Percentage** | Auto-calc in tenant form | 5% |
| 25 | **Design Theme/Cultural Style** | CSS patterns, animation names | "Islamic/Bengali" |
| 26 | **localStorage Key Prefix** | `realestateemperor-storage`, `realestateemperor-data-store` | "real-estate-emperor" |
| 27 | **Package Name** | `package.json` name field | "real-estate-emperor" |

> **Note**: Items 8-11 are design choices. If the client has no preference, use the defaults (emerald/gold/deep-teal/cream). Items 25-27 affect branding but not functionality.

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
10. [WhatsApp Integration](#10-whatsapp-integration)
11. [Deployment](#11-deployment)
12. [Customization Checklist (Per-Client)](#12-customization-checklist-per-client)
13. [File-by-File Customization Map](#13-file-by-file-customization-map)
14. [Full Source Code Reference](#14-full-source-code-reference)

---

## 1. Project Overview

This framework is a comprehensive, multilingual property management application for real estate companies. It is designed as a **reusable template** — the core logic, UI components, RBAC system, i18n, WhatsApp integration, and data layer are all framework code that stays the same for every client. Only client-specific details (company name, colors, credentials, domain, translations, cultural theme) change.

### Core Features (Framework — Identical for All Clients)

- **4-Language UI Support**: English, Arabic (RTL), Bengali, Urdu (RTL) — tenant name forms use EN+AR only
- **5-Language WhatsApp Reminders**: Arabic, English, Urdu, Hindi, Bengali — with language selection popup on both Dashboard and Rent Collection pages
- **Calendar-Based Payment Tracking**: Days 1-2 = Due Soon, Days 3-4 = Unpaid, Day 5+ = Overdue
- **3-Tier RBAC**: Admin (full + User Management), Owner (full except User Mgmt), Staff (limited)
- **In-App Password Reset**: Users submit reset requests; Admin resolves from User Management
- **User Management**: Admin can add/edit/delete users, reset passwords, manage reset requests
- **WhatsApp Integration**: One-click rent reminders with country-specific phone number formatting
- **Real-Time Dashboard**: Overdue alerts, payment status board, revenue trends
- **Kanban Maintenance Board**: Pending → In Progress → Completed workflow
- **P&L Reports**: Profit & Loss with 6-month trends, expense breakdowns, revenue analysis
- **Contract Tracker**: Expiring/expired contract alerts with renewal management
- **Client-Side Persistence**: All data stored in localStorage via Zustand persist
- **Cultural Design Theme**: {{PLACEHOLDER: THEME_NAME}} (e.g., Islamic/Bengali, Modern Minimal, etc.) color palette with geometric patterns

### Important Architectural Decisions (Framework Constants)

- **No backend database**: All data is stored client-side using Zustand + localStorage persistence. Data is per-browser and not shared across devices.
- **No server authentication**: Authentication is performed locally against user credentials in `data-store.ts`.
- **Tenant name form simplified**: Only English (mandatory) and Arabic (optional) name fields in the add/edit tenant dialog. Bengali and Urdu name inputs removed from form UI, though data model supports all 4 languages.
- **WhatsApp language is independent of UI language**: When sending reminders, a popup offers 5 language choices regardless of the current UI language.
- **SPA with Zustand routing**: No Next.js file-based routing. The `currentPage` state in Zustand determines which component renders.
- **All data per-company**: The `companyId` field (default `'company-1'`) scopes all data. Multi-tenancy is not supported — one dashboard per deployment.

---

## 2. Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | ^16.1.1 |
| **Language** | TypeScript | ^5 |
| **Styling** | Tailwind CSS + shadcn/ui (New York style) | ^4 |
| **State Management** | Zustand (with persist middleware) | ^5.0.6 |
| **Charts** | Recharts | ^2.15.4 |
| **Icons** | Lucide React | ^0.525.0 |
| **UI Components** | Full shadcn/ui component set | various |
| **Fonts** | Geist Sans + Geist Mono | via next/font/google |
| **Deployment** | Vercel | — |
| **Package Manager** | Bun | — |
| **Animations** | framer-motion | ^12.23.2 |
| **Date Utilities** | date-fns | ^4.1.0 |
| **Schema Validation** | zod | ^4.0.2 |
| **Toast Notifications** | sonner | ^2.0.6 |

### Key Dependencies (Complete List)

```json
{
  "next": "^16.1.1",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "zustand": "^5.0.6",
  "recharts": "^2.15.4",
  "lucide-react": "^0.525.0",
  "tailwindcss": "^4",
  "typescript": "^5",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "sonner": "^2.0.6",
  "date-fns": "^4.1.0",
  "react-day-picker": "^9.8.0",
  "nanoid": "^5.1.11",
  "zod": "^4.0.2",
  "cmdk": "^1.1.1",
  "framer-motion": "^12.23.2",
  "sharp": "^0.34.3",
  "@radix-ui/react-*": "various (full shadcn/ui primitives)",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@hookform/resolvers": "^5.1.1",
  "@tanstack/react-table": "^8.21.3",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.2",
  "next-themes": "^0.4.6",
  "react-hook-form": "^7.60.0",
  "react-resizable-panels": "^3.0.3",
  "vaul": "^1.1.2"
}
```

---

## 3. Architecture

### Application Structure (Framework — Identical for All Clients)

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata, Toaster
│   ├── page.tsx            # Main SPA page with routing logic + AccessDenied
│   ├── globals.css         # Tailwind + custom CSS + {{THEME}} patterns
│   └── api/
│       └── route.ts        # Health check API endpoint
├── lib/
│   ├── types.ts            # TypeScript interfaces for all data models
│   ├── i18n.ts             # 4-language translation system + WhatsApp 5-language + helpers
│   ├── store.ts            # Auth/navigation/language Zustand store
│   ├── data-store.ts       # Business data Zustand store + user management + seed data
│   └── utils.ts            # Utility functions (formatCurrency, colors, etc.)
├── components/
│   ├── login.tsx           # Login page with {{THEME}} pattern, language selector, forgot password
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
└── components/ui/          # shadcn/ui component library (identical for all clients)
```

### Data Flow (Framework — Identical for All Clients)

```
User Action → Component → Zustand Store → localStorage (persist)
                         ↕
                    React Re-render
```

### Routing (Framework — Identical for All Clients)

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

### Layout Structure (Framework — Identical for All Clients)

```
┌──────────────────────────────────────────────────┐
│  App Shell (min-h-screen bg-cream)               │
│  ┌──────────┬─────────────────────────────────┐  │
│  │          │                                 │  │
│  │ Sidebar  │  Main Content Area              │  │
│  │ (256px)  │  (max-w-[1400px] mx-auto)       │  │
│  │          │  ┌───────────────────────────┐   │  │
│  │ • Logo   │  │  Page Component           │   │  │
│  │ • Nav    │  │  (animate-page-slide)     │   │  │
│  │ • Lang   │  │                           │   │  │
│  │ • User   │  │                           │   │  │
│  │ • Logout │  │                           │   │  │
│  │          │  └───────────────────────────┘   │  │
│  └──────────┴─────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

- **Desktop (>=1024px)**: Sidebar starts open (256px width), can be collapsed to icon-only (16px). Content shifts with `marginLeft`.
- **Mobile (<1024px)**: Sidebar starts closed, opens as overlay with backdrop. No margin shift.

---

## 4. Authentication System

### Overview (Framework — Identical for All Clients)

Authentication is entirely client-side. User credentials are hardcoded in `data-store.ts` as the `DEFAULT_USERS` array. There is no server-side session management or JWT tokens.

### Users (DEFAULT_USERS) — Client-Specific

| ID | Email | Password | Name | Role |
|---|---|---|---|---|
| `user-admin` | {{ADMIN_EMAIL}} | {{ADMIN_PASSWORD}} | {{ADMIN_NAME}} ({{ADMIN_NAME_AR}}) | admin |
| `user-owner` | {{OWNER_EMAIL}} | {{OWNER_PASSWORD}} | {{OWNER_NAME}} ({{OWNER_NAME_AR}}) | owner |
| `user-staff` | {{STAFF_EMAIL}} | {{STAFF_PASSWORD}} | {{STAFF_NAME}} ({{STAFF_NAME_AR}}) | staff |

### AuthUser Interface (Framework — Identical for All Clients)

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

### Auth Flow (Framework — Identical for All Clients)

1. User enters email + password on login page
2. `login.tsx` calls `useDataStore.getState().authenticate(email, password)`
3. The `authenticate` method finds a user with matching email and compares passwords (plaintext)
4. If matched, the user object is stored in the app store via `useAppStore.getState().login(user)`
5. Auth state is persisted in localStorage under key `{{STORAGE_PREFIX}}-storage`
6. On subsequent visits, the persisted auth state is restored automatically

### Authenticate Implementation (Framework — Identical for All Clients)

```ts
authenticate: (email, password) => {
  const user = get().users.find(u => u.email === email)
  if (user && user.password === password) return user
  return null
}
```

### Forgot Password / In-App Reset System (Framework — Identical for All Clients)

Instead of email-based reset, the system uses an in-app reset request flow:

1. User clicks "Forgot Password?" on the login page
2. User fills in email, name, and optional message
3. A `ResetRequest` is created in the data store via `addResetRequest()`
4. The admin sees a badge notification on the Settings sidebar item
5. Admin navigates to User Management → Reset Requests tab
6. Admin can "Reset & Resolve" (opens password reset dialog) or "Dismiss" the request
7. When resolved, admin sets a new password for the user

### ResetRequest Interface (Framework — Identical for All Clients)

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

### Auto-Seeding (Framework — Identical for All Clients)

When a user logs in for the first time, if `isSeeded` is `false`, the system automatically calls `seedData()` to populate the store with sample data. **The seed data content is client-specific** — update the `createSeedData()` function with client-appropriate building names, tenant names, addresses, and expense vendors.

### Data Store Migration (Framework — Identical for All Clients)

The store includes a migration system (version 1) that:
- Ensures the admin user always exists (re-adds if missing from persisted state)
- Adds `resetRequests` array if missing from older persisted state

---

## 5. Data Layer

### Storage (Framework Logic Identical — Keys Are Client-Specific)

| Store | localStorage Key | Persisted Fields |
|---|---|---|
| **App Store** | `{{STORAGE_PREFIX}}-storage` | `isAuthenticated`, `authUser`, `language` |
| **Data Store** | `{{STORAGE_PREFIX}}-data-store` | `users`, `resetRequests`, `properties`, `tenants`, `payments`, `expenses`, `maintenanceItems`, `isSeeded` |

### LocalUser Interface (Framework — Identical for All Clients)

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

### Data Models (Framework — Identical for All Clients)

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
  emiratesId: string | null        // {{COUNTRY_SPECIFIC: "Emirates ID" for UAE, change label for other countries}}
  nationality: string | null
  employer: string | null
  emergencyContact: string | null
  unitNumber: string | null
  unitType: string | null
  floor: number | null
  sizeSqft: number | null
  rentAmount: number
  municipalityFee: number | null   // {{COUNTRY_SPECIFIC: "Municipality Fee" for UAE, change for other countries}}
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

### CompanyInfo — Client-Specific

```ts
export interface CompanyInfo {
  id: string
  name: string              // {{COMPANY_NAME_EN}}
  nameAr: string            // {{COMPANY_NAME_AR}}
  nameBn: string            // {{COMPANY_NAME_BN}}
  nameUr: string            // {{COMPANY_NAME_UR}}
  phone: string             // {{COMPANY_PHONE}}
  email: string             // {{COMPANY_EMAIL}}
  address: string           // {{COMPANY_ADDRESS}}
}
```

Default company template:

```ts
const DEFAULT_COMPANY: CompanyInfo = {
  id: 'company-1',
  name: '{{COMPANY_NAME_EN}}',
  nameAr: '{{COMPANY_NAME_AR}}',
  nameBn: '{{COMPANY_NAME_BN}}',
  nameUr: '{{COMPANY_NAME_UR}}',
  phone: '{{COMPANY_PHONE}}',
  email: '{{COMPANY_EMAIL}}',
  address: '{{COMPANY_ADDRESS}}',
}
```

### CRUD Operations (Framework — Identical for All Clients)

| Entity | Operations |
|---|---|
| **Users** | `addUser`, `updateUser`, `deleteUser`, `resetUserPassword`, `generateRandomPassword` |
| **Reset Requests** | `addResetRequest`, `resolveResetRequest`, `dismissResetRequest`, `getPendingResetCount` |
| **Properties** | `addProperty`, `updateProperty`, `deleteProperty`, `archiveProperty` |
| **Tenants** | `addTenant`, `updateTenant`, `deleteTenant` |
| **Payments** | `addPayment` (also updates tenant score on late payments) |
| **Expenses** | `addExpense`, `updateExpense`, `deleteExpense` |
| **Maintenance** | `addMaintenance`, `updateMaintenance`, `deleteMaintenance` |

### Cascade Deletes (Framework — Identical for All Clients)

- **Property delete**: Removes the property and all associated tenants
- **Tenant delete**: Removes the tenant and all their payments

### Payment Side Effects (Framework — Identical for All Clients)

When a payment is added via `addPayment`, if the payment is marked as late (`isLate: true`), the tenant's score is decremented by 5 (minimum 0) and `latePaymentCount` is incremented.

### Computed Getters (Framework — Identical for All Clients)

| Getter | Description |
|---|---|
| `getTenantsWithRelations()` | Tenants with payments and property joined |
| `getPropertiesWithTenants(includeArchived)` | Properties with active tenants |
| `getDashboardData()` | Full dashboard stats, charts, alerts |
| `getReportData(month, year)` | Financial report with P&L |

### ID Generation (Framework — Identical for All Clients)

```ts
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
```

### Random Password Generator (Framework — Identical for All Clients)

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

## 6. Internationalization (i18n)

### UI Languages (Framework — Identical for All Clients)

| Code | Language | Direction | Native Name |
|---|---|---|---|
| `en` | English | LTR | English |
| `ar` | Arabic | RTL | العربية |
| `bn` | Bengali | LTR | বাংলা |
| `ur` | Urdu | RTL | اردو |

### WhatsApp Message Languages (Framework — Identical for All Clients)

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

### Translation System (Framework — Identical for All Clients)

- All translations are in `src/lib/i18n.ts` as a single `translations` object
- Each key maps to `{ en, ar, bn, ur }` values
- The `t(key, lang)` function retrieves translations with English fallback
- RTL languages (`ar`, `ur`) automatically set `document.documentElement.dir = 'rtl'`
- All translations are academic/professional, NOT transliterations
- **Client-specific**: The `loginSubtitle` translation key must contain the client's company name in all 4 languages

### Key i18n Functions (Framework — Identical for All Clients)

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

### Translation Keys That Must Be Updated Per Client

| Key | What to Change |
|---|---|
| `loginSubtitle` | Replace company name in all 4 languages |
| `resetSubject` | Replace company name in the password reset email subject line |
| Any hardcoded company name in component files | Sidebar header text, API health check |

---

## 7. Role-Based Access Control (RBAC)

### Roles (Framework — Identical for All Clients)

| Role | Can View Financial Data | Can Access Expenses | Can Access Reports | Can Access User Management |
|---|---|---|---|---|
| **Admin** | Yes | Yes | Yes | Yes |
| **Owner** | Yes | Yes | Yes | No |
| **Staff** | No | No | No | No |

### Implementation Functions (Framework — Identical for All Clients)

```ts
export function isOwnerOrAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

export function isAdminOnly(role: string): boolean {
  return role === 'admin'
}
```

### Access Control in page.tsx (Framework — Identical for All Clients)

```ts
const isFinancialUser = isOwnerOrAdmin(authUser.role)
const isSystemAdmin = isAdminOnly(authUser.role)

case 'expenses': return isFinancialUser ? <Expenses /> : <AccessDenied />
case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />
case 'settings': return isSystemAdmin ? <UserManagement /> : <AccessDenied type="admin" />
```

### AccessDenied Component (Framework — Identical for All Clients)

The `AccessDenied` component displays different messages based on the `type` prop:
- `type="financial"` (default): "Access Denied - Financial data is only visible to Owner/Admin"
- `type="admin"`: "User Management is only accessible by the System Administrator"

### Staff Restrictions (Framework — Identical for All Clients)

- Cannot view revenue amounts on Dashboard
- Cannot view rent amounts on Payment Status Board
- Cannot access Expenses page
- Cannot access Reports page
- Cannot delete tenants
- Cannot view security deposit amounts

### Sidebar Navigation Visibility (Framework — Identical for All Clients)

| Page | Admin | Owner | Staff |
|---|---|---|---|
| Dashboard | Yes | Yes | Yes |
| Properties | Yes | Yes | Yes |
| Tenants | Yes | Yes | Yes |
| Rent Collection | Yes | Yes | Yes |
| Maintenance | Yes | Yes | Yes |
| Expenses | Yes | Yes | No |
| Reports | Yes | Yes | No |
| Contracts | Yes | Yes | Yes |
| Settings (User Mgmt) | Yes | No | No |

### Sidebar Navigation Items Definition (Framework — Identical for All Clients)

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

### Reset Request Badge (Framework — Identical for All Clients)

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
- Property types: apartment, villa, office, shop, studio, mixed_use

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
  - Auto-calculated municipality fee ({{MUNICIPALITY_FEE_PERCENT}}% of rent)
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
- Maintenance categories: AC, Plumbing, Electrical, Lock/Door, Painting, Structural, Other

### 8.6 Expenses (`expenses.tsx`)

- **Owner/Admin only** (Staff see Access Denied)
- Monthly summary cards with category breakdowns
- Category filter buttons with icons
- Expense table with category, description, amount, date, vendor, invoice, recurring flag
- Add/Edit dialog with all expense fields
- Expense categories: Maintenance, Utility, Insurance, Manpower, Municipality, Leasing, Security, Other

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

### Color Palette — Client-Specific (Defaults Shown)

| Token | Default Hex | Usage | Customization Notes |
|---|---|---|---|
| `emerald` | #0D7C3D | Primary actions, positive indicators | Change to client's brand green |
| `gold` | #C5A028 | Accent, sidebar highlights, premium feel | Change to client's accent/gold |
| `cream` | #FFF8E7 | Background, warm paper-like feel | Can be lighter or warmer per client |
| `deep-teal` | #0A5C4E | Sidebar background, headings | Change to client's sidebar color |
| `terracotta` | #C4653A | Expenses, negative amounts | Generally stays the same |
| `bengali-green` | #006A4E | Decorative accents | Cultural — change for non-Bengali clients |
| `bengali-red` | #C1272D | Decorative accents | Cultural — change for non-Bengali clients |
| `islamic-gold` | #D4AF37 | Decorative accents | Cultural — change for non-Islamic clients |
| `deep-maroon` | #800020 | Chart colors | Generally stays the same |
| `warm-saffron` | #F4C430 | Chart colors | Generally stays the same |

### CSS Custom Properties (globals.css) — Client-Specific

```css
:root {
  --radius: 0.625rem;
  --background: {{CREAM_COLOR}};            /* default: #FFF8E7 */
  --foreground: #1a1a1a;
  --card: #ffffff;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;
  --primary: {{PRIMARY_COLOR}};             /* default: #0D7C3D */
  --primary-foreground: #ffffff;
  --secondary: #f0ebe0;
  --secondary-foreground: #1a1a1a;
  --muted: #f5f0e5;
  --muted-foreground: #6b7280;
  --accent: {{GOLD_COLOR}};                 /* default: #C5A028 */
  --accent-foreground: #ffffff;
  --destructive: #dc2626;
  --border: #e5e0d5;
  --input: #e5e0d5;
  --ring: {{PRIMARY_COLOR}};                /* default: #0D7C3D */
  --chart-1: {{PRIMARY_COLOR}};             /* default: #0D7C3D */
  --chart-2: {{GOLD_COLOR}};                /* default: #C5A028 */
  --chart-3: {{SIDEBAR_COLOR}};             /* default: #0A5C4E */
  --chart-4: #C4653A;
  --chart-5: #800020;
  --sidebar: {{SIDEBAR_COLOR}};             /* default: #0A5C4E */
  --sidebar-foreground: #ffffff;
  --sidebar-primary: {{GOLD_COLOR}};         /* default: #C5A028 */
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: {{PRIMARY_COLOR}};       /* default: #0D7C3D */
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255,255,255,0.1);
  --sidebar-ring: {{GOLD_COLOR}};            /* default: #C5A028 */
}
```

### CSS Special Classes (Framework — Some Are Client-Specific)

| Class | Description | Customization |
|---|---|---|
| `.islamic-pattern` | Geometric background pattern for sidebar | Change for different cultural themes or use solid color |
| `.islamic-pattern-full` | Full-page geometric pattern for login | Change for different cultural themes or use solid color |
| `.overdue-pulse` | Pulsing animation for overdue alerts (1.5s) | Keep (functional) |
| `.animate-fade-in-up` | Fade in + slide up animation (0.4s) | Keep (functional) |
| `.stagger-children` | Staggered children animations (0.05s) | Keep (functional) |
| `.custom-scrollbar` | Thin custom scrollbar (6px width) | Keep (functional) |
| `.card-hover` | Hover lift effect for cards | Keep (functional) |
| `.property-card-hover` | Property card specific hover | Keep (functional) |
| `.status-paid` | Glowing green border for paid status | Keep (functional) |
| `.status-overdue` | Glowing red border for overdue status | Keep (functional) |
| `.status-partial` | Glowing amber border for partial status | Keep (functional) |
| `.islamic-border-top` | Gold/teal repeating border top | Cultural — change or remove |
| `.bengali-accent` | Red-green gradient border left | Cultural — change or remove |
| `.geometric-divider` | Gold/teal repeating horizontal divider | Cultural — change or remove |
| `.animate-skyline-float` | Floating building skyline (6s) | Keep (functional) |
| `.animate-gold-shimmer` | Gold shimmer text effect (3s) | Cultural — can keep or change color |
| `.animate-building-rise` | Card rise with bounce (0.5s) | Keep (functional) |
| `.animate-door-open` | 3D door open for dialogs (0.35s) | Keep (functional) |
| `.animate-key-turn` | Key turn animation for login (2s) | Keep (functional) |
| `.animate-notify-pulse` | Notification badge pulse (2s) | Keep (functional) |
| `.animate-page-slide` | Smooth page transition (0.3s) | Keep (functional) |
| `.animate-income-flow` | Income flow pulse for revenue numbers | Keep (functional) |
| `.animate-count-up` | Counter animation for stats | Keep (functional) |

### Animations Reference (Framework — Identical for All Clients)

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
| Door open | 0.35s | perspective(800px) rotateY(-8deg) → rotateY(0deg) |
| Key turn | 2s | rotate(0deg) → -15deg → 0 → 15deg → 0 |
| Skyline float | 6s | translateY(0) → -6px → 0 |

### Fonts (Framework — Identical for All Clients)

- **Geist Sans** (variable: `--font-geist-sans`) — Primary UI font
- **Geist Mono** (variable: `--font-geist-mono`) — Code/monospace font

### Metadata — Client-Specific

```ts
export const metadata: Metadata = {
  title: "{{COMPANY_NAME_EN}}",
  description: "Property Dashboard - {{COMPANY_NAME_EN}}",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>{{FAVICON_EMOJI}}</text></svg>",
  },
}
```

---

## 10. WhatsApp Integration

### Phone Formatting — Country-Specific

The `getWhatsAppLink` function auto-converts phone numbers to the country's international format:

- Numbers starting with `0` → prefixed with `{{COUNTRY_CODE}}` (default: `971` for UAE)
- Numbers starting with `00` → stripped to bare country code
- Numbers without a recognized country code → assumed country and prefixed with `{{COUNTRY_CODE}}`
- WhatsApp number priority: `tenant.whatsapp || tenant.phone`

### WhatsApp Message Template — Client-Specific

```
Subject: Rent Payment Reminder
Dear {name},
This is a reminder that your monthly rent for {month} {year} in the amount of {{CURRENCY}} {amount} is currently outstanding.
Kindly arrange for payment at your earliest convenience.
Best regards,
{{COMPANY_NAME_EN}}
```

### WhatsApp Language Selection Popup (Framework — Identical for All Clients)

When clicking "Remind" or "Send WhatsApp Reminder", a popup appears with 5 language buttons:

| Button Color | Language | Label |
|---|---|---|
| Green | Arabic | العربية |
| Blue | English | English |
| Teal | Urdu | اردو |
| Orange | Hindi | हिन्दी |
| Purple | Bengali | বাংলা |

This popup is available in BOTH the Dashboard (Payment Status Board) and the Rent Collection page.

### Currency Formatting — Country-Specific

The `formatAED` function in `utils.ts` formats amounts with the local currency:

```ts
export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' {{CURRENCY_CODE}}'  // default: "AED"
}
```

For other countries, change the locale and currency code (e.g., `'en-SA'` + `'SAR'` for Saudi Arabia).

---

## 11. Deployment

### Vercel Deployment (Framework — Identical Process for All Clients)

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Node.js Version** | 18.x+ |
| **Live URL** | https://{{VERCEL_PROJECT_SLUG}}.vercel.app |

### Deployment Steps (Framework — Identical for All Clients)

1. Create new Vercel project (or use `npx vercel --prod`)
2. Push to the connected GitHub repository
3. Vercel auto-detects Next.js framework
4. Build and deploy automatically

### Local Development

```bash
bun install
bun run dev
# Opens on http://localhost:3000
```

### Environment Variables

The application does **NOT** require any environment variables. All configuration is hardcoded in the source files.

### Health Check Endpoint — Client-Specific

```
GET /api
```

Response:

```json
{ "status": "ok", "app": "{{COMPANY_NAME_EN}}" }
```

---

## 12. Customization Checklist (Per-Client)

When spinning up a new client instance, follow this checklist in order:

### Step 1: Clone & Setup
- [ ] Clone the framework repository into a new folder named after the client
- [ ] Update `package.json` `name` field to `{{CLIENT_SLUG}}`
- [ ] Run `bun install`

### Step 2: Company Identity
- [ ] Update `DEFAULT_COMPANY` in `data-store.ts` with client's company name (4 languages), phone, email, address
- [ ] Update `DEFAULT_USERS` in `data-store.ts` with client's admin, owner, staff credentials and names
- [ ] Update `metadata` in `layout.tsx` with client's company name and favicon emoji
- [ ] Update the `loginSubtitle` translation key in `i18n.ts` with client's company name in all 4 languages
- [ ] Update the `resetSubject` translation key with client's company name
- [ ] Update the API health check response in `api/route.ts` with client's company name

### Step 3: Design & Branding
- [ ] Update CSS custom properties in `globals.css` with client's brand colors
- [ ] Replace or update `.islamic-pattern` / `.islamic-pattern-full` CSS patterns if the cultural theme differs
- [ ] Replace `.bengali-accent` / `.islamic-border-top` / `.geometric-divider` if not culturally appropriate
- [ ] Update sidebar logo icon (currently `Moon` from Lucide) in `sidebar.tsx`
- [ ] Update sidebar header text in `sidebar.tsx` (currently shows company short name per language)
- [ ] Update `.animate-gold-shimmer` gradient colors if accent color changed

### Step 4: Country/Locale Specifics
- [ ] Update `formatAED` in `utils.ts` — change locale and currency code
- [ ] Update `getWhatsAppLink` in `i18n.ts` — change default country code for phone formatting
- [ ] Update `emiratesId` label in `i18n.ts` if not UAE (change to "National ID" or equivalent)
- [ ] Update `municipalityFee` label in `i18n.ts` if not UAE (change to appropriate fee name)
- [ ] Update municipality fee percentage in tenant auto-calculation if different from 5%

### Step 5: localStorage Keys
- [ ] Update `name: 'realestateemperor-storage'` in `store.ts` to `{{CLIENT_SLUG}}-storage`
- [ ] Update `name: 'realestateemperor-data-store'` in `data-store.ts` to `{{CLIENT_SLUG}}-data-store`

### Step 6: Seed Data
- [ ] Update `createSeedData()` in `data-store.ts` with client-appropriate property names, addresses, tenant names, expense vendors
- [ ] Update the migration system's fallback admin user to match the new `DEFAULT_USERS[0]`

### Step 7: Deploy
- [ ] Create new Vercel project: `npx vercel --prod`
- [ ] Set custom domain if applicable
- [ ] Test all features with the new credentials
- [ ] Verify WhatsApp phone formatting works for the client's country
- [ ] Verify currency formatting displays correctly

---

## 13. File-by-File Customization Map

This section lists every file and exactly which parts need customization per client.

### `package.json`
- `name`: Change from `"real-estate-emperor"` to `"{{CLIENT_SLUG}}"`

### `src/app/layout.tsx`
- `metadata.title`: Change company name
- `metadata.description`: Change company name
- `metadata.icons.icon`: Change favicon emoji

### `src/app/page.tsx`
- No changes needed (framework logic only)

### `src/app/globals.css`
- All `:root` CSS custom properties (colors)
- `@theme inline` color definitions
- `.islamic-pattern` and `.islamic-pattern-full` (cultural patterns)
- `.islamic-border-top`, `.bengali-accent`, `.geometric-divider` (cultural decorations)
- `.animate-gold-shimmer` gradient colors (if gold changed)

### `src/app/api/route.ts`
- Change company name in health check response

### `src/lib/types.ts`
- No changes needed (framework types only)

### `src/lib/i18n.ts`
- `loginSubtitle` translation key: company name in 4 languages
- `resetSubject` translation key: company name
- WhatsApp message templates in `getWhatsAppLink`: company name in signature
- Country-specific labels: `emiratesId`, `municipalityFee` if not UAE
- Currency label in `monthlyRent`, `amount`, etc. if not AED

### `src/lib/store.ts`
- `name: 'realestateemperor-storage'`: Change localStorage key prefix

### `src/lib/data-store.ts`
- `DEFAULT_COMPANY`: All fields (name, nameAr, nameBn, nameUr, phone, email, address)
- `DEFAULT_USERS`: All 3 default users (names, emails, passwords)
- `name: 'realestateemperor-data-store'`: Change localStorage key prefix
- `createSeedData()`: Property names, tenant names, addresses, expense vendors
- Migration fallback admin user: Match new `DEFAULT_USERS[0]`
- All `companyId: 'company-1'` references (only if multi-company needed — typically no change)

### `src/lib/utils.ts`
- `formatAED`: Change locale and currency code
- Date formatting locale in `formatDate` if not UAE

### `src/components/login.tsx`
- Placeholder text in email input: currently `"owner@realestate.ae"` — change to client's default
- Cultural security message text (hardcoded 4-language string)

### `src/components/sidebar.tsx`
- Sidebar header text: Currently shows short company name per language
- Logo icon: Currently `Moon` from Lucide

### `src/components/dashboard.tsx`
- No client-specific changes (framework component)

### `src/components/properties.tsx`
- No client-specific changes (framework component)

### `src/components/tenants.tsx`
- No client-specific changes (framework component)

### `src/components/rent-collection.tsx`
- No client-specific changes (framework component)

### `src/components/maintenance.tsx`
- No client-specific changes (framework component)

### `src/components/expenses.tsx`
- No client-specific changes (framework component)

### `src/components/reports.tsx`
- No client-specific changes (framework component)

### `src/components/contracts.tsx`
- No client-specific changes (framework component)

### `src/components/user-management.tsx`
- No client-specific changes (framework component)

### `src/components/ui/*`
- No changes needed (shadcn/ui primitives — identical for all clients)

### `src/hooks/*`
- No changes needed (framework hooks — identical for all clients)

---

## 14. Full Source Code Reference

| File | Description | Customization Level |
|---|---|---|
| `src/app/layout.tsx` | Root layout with Geist fonts, metadata, Toaster | Client-specific (metadata) |
| `src/app/page.tsx` | Main SPA page with routing, RTL handling, AccessDenied component | Framework (no changes) |
| `src/app/globals.css` | Tailwind 4 config, color palette, CSS animations, cultural patterns | Client-specific (colors, patterns) |
| `src/app/api/route.ts` | Health check API endpoint | Client-specific (company name) |
| `src/lib/types.ts` | TypeScript interfaces for all data models | Framework (no changes) |
| `src/lib/i18n.ts` | 4-language translation system, WhatsAppLanguage type, 5-language WhatsApp messages, all helper functions | Client-specific (company name in translations, country-specific labels) |
| `src/lib/store.ts` | AuthUser interface, AppState, useAppStore (auth, navigation, language, sidebar), isOwnerOrAdmin, isAdminOnly | Client-specific (localStorage key) |
| `src/lib/data-store.ts` | CompanyInfo, ResetRequest, LocalUser interfaces, DataState, DEFAULT_COMPANY, DEFAULT_USERS, seed data, all CRUD operations, computed getters, migration system | Client-specific (company info, users, seed data, localStorage key) |
| `src/lib/utils.ts` | cn, formatAED, formatDate, getPaymentStatusColor, getStatusColor, getPriorityColor, getMaintenanceStatusColor, getCategoryIcon, cn2 | Client-specific (currency format) |
| `src/components/login.tsx` | Login page with cultural pattern, language selector, forgot password form | Client-specific (placeholder email, cultural text) |
| `src/components/sidebar.tsx` | Navigation sidebar with role-based visibility, language cycling, reset request badge | Client-specific (logo icon, company name) |
| `src/components/dashboard.tsx` | Dashboard with stats, payment status board, WhatsApp language popup, revenue chart | Framework (no changes) |
| `src/components/properties.tsx` | Property CRUD with archive/sell | Framework (no changes) |
| `src/components/tenants.tsx` | Tenant CRUD with profiles, scores, payment history | Framework (no changes) |
| `src/components/rent-collection.tsx` | Rent collection with calendar-based status, payment date, WhatsApp language popup | Framework (no changes) |
| `src/components/maintenance.tsx` | Kanban board for maintenance | Framework (no changes) |
| `src/components/expenses.tsx` | Expense tracking (Owner/Admin only) | Framework (no changes) |
| `src/components/reports.tsx` | Financial reports with P&L (Owner/Admin only) | Framework (no changes) |
| `src/components/contracts.tsx` | Contract tracker with expiry alerts | Framework (no changes) |
| `src/components/user-management.tsx` | User CRUD, password management, reset requests (Admin only) | Framework (no changes) |
| `src/components/ui/*` | Full shadcn/ui component library | Framework (no changes) |

---

### Utility Functions (utils.ts) — Framework Reference

```ts
// Tailwind class merging
export function cn(...inputs: ClassValue[]): string

// Format amount as local currency
export function formatAED(amount: number): string
// Example: formatAED(5000) → "5,000 AED"  (change to client's currency)

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

### Responsive Sidebar Behavior (Framework — Identical for All Clients)

The sidebar automatically adapts to screen size:
- **Desktop (>=1024px)**: Sidebar starts open (256px width), can be collapsed to icon-only (16px). Content shifts with `marginLeft`.
- **Mobile (<1024px)**: Sidebar starts closed, opens as overlay with backdrop. No margin shift.
- Page content is wrapped in `max-w-[1400px] mx-auto` with responsive padding (`p-4 md:p-6 lg:p-8`).

---

### Login Page Layout (Framework — Identical for All Clients)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────┬────────────────────────────┐  │
│  │                  │                            │  │
│  │  Pattern BG      │    Login Form              │  │
│  │  (islamic-       │    ┌──────────────────┐    │  │
│  │   pattern-full)  │    │ Language Buttons  │    │  │
│  │                  │    │ [EN] [AR] [BN]   │    │  │
│  │  • Logo (Moon)   │    │                  │    │  │
│  │  • Company Name  │    │ Email Input      │    │  │
│  │  • Security Info │    │ Password Input   │    │  │
│  │                  │    │ [Sign In Button] │    │  │
│  │  (hidden on      │    │                  │    │  │
│  │   mobile)        │    │ Forgot Password? │    │  │
│  │                  │    └──────────────────┘    │  │
│  │                  │    bg-cream                 │  │
│  └──────────────────┴────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Left panel: 50% width on desktop, hidden on mobile (`hidden lg:flex lg:w-1/2`)
- Right panel: Login form with language selector, centered in remaining space
- Mobile: Only the form is shown, with a small logo above

---

### Print Styles (Framework — Identical for All Clients)

```css
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  body { background: white !important; }
}
```

Used in the Reports module for printing financial reports.
