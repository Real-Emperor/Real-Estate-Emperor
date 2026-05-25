# Al Reef Al Junoobi - Technical Handover Document

**Project:** Al Reef Al Junoobi Real Estate & General Maintenance L.L.C. Property Dashboard  
**Version:** 0.2.0  
**Live URL:** https://al-reef-al-junoobi.vercel.app  
**Deployment:** Vercel (Framework: Next.js)  
**Repository:** GitHub (private)  
**Date:** 2026-05-26

---

## 1. Project Overview

Al Reef Al Junoobi is a custom-built, multi-tenant property management dashboard designed for a Bengali family-run real estate company operating in Abu Dhabi, UAE. The system manages residential and commercial rental properties, tracks tenant payments, handles maintenance requests, monitors expenses, and generates financial reports. It was built with an Islamic Bengali identity design system, supporting four languages (English, Arabic, Bengali, Urdu) with full RTL support for Arabic and Urdu.

The application is a single-page app (SPA) built on Next.js 16 with the App Router pattern. It uses client-side Zustand stores with localStorage persistence instead of a traditional backend database, making it instantly deployable without server infrastructure. Authentication is handled locally with role-based access control (Owner/Admin/Staff), where Staff users cannot view financial data.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.1 | React framework (App Router) |
| React | 19.0.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | New York style | UI component library |
| Zustand | 5.0.6 | State management + localStorage persistence |
| Recharts | 2.15.4 | Data visualization (Bar, Pie, Area charts) |
| Radix UI | Various | Accessible primitives for shadcn/ui |
| Lucide React | 0.525.0 | Icon library |
| date-fns | 4.1.0 | Date formatting |
| react-hook-form + Zod | 7.60 / 4.0 | Form validation |
| next-intl | 4.3.4 | Internationalization |
| Bun | Latest | Package manager & runtime |
| Vercel | - | Deployment platform |

---

## 3. Architecture

### 3.1 Application Structure

The app follows the Next.js App Router pattern with a single page (`src/app/page.tsx`) that renders different feature components based on navigation state. There is no server-side rendering of data; all data lives in Zustand stores persisted to localStorage.

```
src/
  app/
    layout.tsx          # Root layout (fonts, metadata, Toaster)
    page.tsx            # Main SPA page (renders current module)
    globals.css         # Global styles + Islamic design system
    api/
      route.ts          # Health check endpoint
  components/
    login.tsx           # Login page with 4-language selector
    sidebar.tsx         # Navigation sidebar with Islamic pattern
    dashboard.tsx       # Overview with stats, charts, payment board
    properties.tsx      # Property CRUD with archive support
    tenants.tsx         # Full tenant management with profile view
    rent-collection.tsx # Monthly rent tracking with WhatsApp reminders
    maintenance.tsx     # Kanban board for maintenance tasks
    expenses.tsx        # Expense tracking (Owner/Admin only)
    reports.tsx         # P&L reports with charts (Owner/Admin only)
    contracts.tsx       # Contract expiry tracker
    ui/                 # 52 shadcn/ui components
  hooks/
    use-mobile.ts       # Mobile breakpoint detection
    use-toast.ts        # Toast notification system
  lib/
    types.ts            # TypeScript interfaces
    i18n.ts             # 4-language translation system
    store.ts            # Auth + navigation state (Zustand)
    data-store.ts       # All data CRUD + seed data (Zustand)
    utils.ts            # Formatting + color helpers
```

### 3.2 Data Flow

1. User logs in via `login.tsx` -> authenticates against `useDataStore` users
2. On first login, seed data is auto-loaded (4 buildings, 20 tenants, 6 months of payments, expenses, maintenance)
3. All CRUD operations go through `useDataStore` Zustand actions
4. State is persisted to localStorage under keys `al-reef-storage` and `al-reef-data-store`
5. Components read data via `useDataStore.getState().getXxx()` methods

### 3.3 No Backend API

The only API route is a health check at `/api/route.ts`. All data operations happen client-side through Zustand stores. This was a deliberate design choice for simplicity and zero infrastructure cost.

---

## 4. Authentication System

### 4.1 Local Authentication

Authentication is handled entirely client-side. User credentials are stored in the `useDataStore` Zustand store:

| Role | Email | Password |
|---|---|---|
| Owner | owner@alreef.ae | owner123 |
| Staff | staff@alreef.ae | staff123 |

### 4.2 Auth Flow

1. User enters email + password on login page
2. `handleLogin()` calls `useDataStore.getState().authenticate(email, password)`
3. If matched, user object is stored in `useAppStore` (persisted to localStorage)
4. Auto-seed: if `isSeeded === false`, seed data is loaded on first successful login
5. Session persists across browser refreshes via localStorage

### 4.3 Session Storage

Auth state is persisted under localStorage key `al-reef-storage` with:
- `isAuthenticated: boolean`
- `authUser: AuthUser | null`
- `language: Language`

---

## 5. Data Layer

### 5.1 Zustand Stores

Two separate Zustand stores with `persist` middleware:

**`useAppStore`** (key: `al-reef-storage`) - Auth, navigation, language, sidebar state

**`useDataStore`** (key: `al-reef-data-store`) - All business data:
- `company: CompanyInfo`
- `users: LocalUser[]`
- `properties: PropertyData[]`
- `tenants: TenantData[]`
- `payments: PaymentData[]`
- `expenses: ExpenseData[]`
- `maintenanceItems: MaintenanceData[]`
- `isSeeded: boolean`

### 5.2 CRUD Operations

Every entity has full Create, Read, Update, Delete operations:
- Properties: add, update, delete, archive
- Tenants: add, update, delete (cascades to payments)
- Payments: add (auto-updates tenant score on late payment)
- Expenses: add, update, delete
- Maintenance: add, update, delete

### 5.3 Computed Data Methods

- `getTenantsWithRelations()` - joins tenants with payments and properties
- `getPropertiesWithTenants(includeArchived?)` - joins properties with active tenants
- `getDashboardData()` - computes all dashboard stats, overdue lists, chart data
- `getReportData(month, year)` - computes P&L, occupancy, collection rate, trends

### 5.4 Seed Data

The `createSeedData()` function generates:
- 4 properties (Buildings A-D in Khalifa City A and Musaffah)
- 20 tenants with diverse nationalities (Pakistani, Indian, Syrian, Jordanian, Egyptian, Emirati, Bangladeshi, Yemeni)
- 6 months of payment history with realistic late payment patterns
- 14 expense entries across categories
- 7 maintenance tasks in various statuses

---

## 6. Internationalization (i18n)

### 6.1 Supported Languages

| Code | Language | RTL |
|---|---|---|
| en | English | No |
| ar | Arabic | Yes |
| bn | Bengali | No |
| ur | Urdu | Yes |

### 6.2 Translation System

All translations are defined in `src/lib/i18n.ts` as a single `translations` object with 200+ keys. The `t(key, lang)` function retrieves translations with English fallback.

### 6.3 Multi-Language Names

All entities (Company, Properties, Tenants) have `name`, `nameAr`, `nameBn`, `nameUr` fields. The `getNameByLang(obj, lang)` helper returns the appropriate name based on current language.

### 6.4 WhatsApp Messages

WhatsApp reminder messages are generated in all 4 languages with proper formatting, addressing the tenant by name and including the overdue amount and month.

### 6.5 RTL Support

When Arabic or Urdu is selected, `document.documentElement.dir` is set to `rtl` and `document.documentElement.lang` is updated. The sidebar and login page adjust layout accordingly.

---

## 7. Role-Based Access Control (RBAC)

### 7.1 Roles

| Role | Dashboard | Properties | Tenants | Rent | Maintenance | Expenses | Reports | Contracts |
|---|---|---|---|---|---|---|---|---|
| Owner | Full | Full | Full | Full | Full | Full | Full | Full |
| Admin | Full | Full | Full | Full | Full | Full | Full | Full |
| Staff | Limited | Full | Full | Limited | Full | Denied | Denied | Full |

### 7.2 Financial Data Protection

Staff users see:
- Dashboard: tenant counts, occupancy, but NO revenue/overdue amounts (shows lock icon + "Financial data is protected")
- Rent Collection: NO rent amounts or remaining balances
- Expenses: Access denied (shows lock icon)
- Reports: Access denied (shows lock icon)

The `isOwnerOrAdmin(role)` helper in `store.ts` determines financial visibility.

### 7.3 Sidebar Navigation

The sidebar filters out Expenses and Reports navigation items for Staff users. The `visibleNavItems` array is computed based on the authenticated user's role.

---

## 8. Feature Modules

### 8.1 Dashboard (`dashboard.tsx`)
- Monthly overview with 4 stat cards (Collected Revenue, Overdue, Active Tenants, Occupancy Rate)
- Overdue alert banner with pulsing animation
- Payment Status Board (color-coded grid: green=paid, red=overdue, amber=partial)
- Revenue Trend bar chart (6 months, Expected vs Collected)
- Recent Payments feed
- Financial data hidden for Staff users

### 8.2 Properties (`properties.tsx`)
- Card grid view of all properties
- Add/Edit dialog with 4-language name fields
- Property type selector (Apartment, Villa, Office, Shop, Studio, Mixed Use)
- Archive/restore functionality (for sold/demolished buildings)
- Occupancy and monthly revenue per property
- Delete with confirmation

### 8.3 Tenants (`tenants.tsx`)
- Searchable, filterable table with tenant scores and status badges
- Expandable payment history rows
- Full tenant profile dialog with 5 sections: Personal, Contact, Lease, Financial, Payment History
- Add/Edit dialog with 4-language name fields and auto-calculated municipality fee
- WhatsApp reminder integration
- Tenant scoring system (0-100, color-coded: green/blue/amber/red)

### 8.4 Rent Collection (`rent-collection.tsx`)
- Month selector with navigation arrows
- Stats row: Active, Paid, Partial, Overdue counts
- Collection progress bar
- Filter: All, Paid, Unpaid, Overdue
- Tenant payment cards with "Mark Paid" and "WhatsApp Remind" actions
- "Remind All Unpaid" bulk action
- Record Payment dialog with amount, method, reference, notes

### 8.5 Maintenance (`maintenance.tsx`)
- Kanban board with 3 columns: Pending, In Progress, Completed
- Color-coded priority badges (Urgent=red, High=orange, Medium=amber, Low=green)
- Category labels (AC, Plumbing, Electrical, Lock/Door, Painting, Structural, Other)
- One-click status progression (Pending -> In Progress -> Completed)
- Estimated vs Actual cost tracking
- Vendor/technician assignment

### 8.6 Expenses (`expenses.tsx`)
- Owner/Admin only access
- Monthly summary cards by category
- Category filter buttons
- Full table with category, description, amount, date, vendor, invoice, recurring flag
- Add/Edit dialog with 8 expense categories
- Recurring expense checkbox

### 8.7 Reports (`reports.tsx`)
- Owner/Admin only access
- Month selector with print support
- Revenue/Expenses/Profit summary cards
- 6-month trend bar chart
- Expense breakdown pie chart
- Revenue Analysis section with area chart and breakdown
- Full Profit & Loss statement (Rental Income, Other Income, Gross Revenue, Vacancy Loss, Bad Debt, Gross Profit, Operating Expenses, Net Income)
- Margin indicators (Collection Rate, Occupancy Rate, Net Profit Margin)

### 8.8 Contracts (`contracts.tsx`)
- Contract expiry tracker with status: Active, Expiring Soon (<60 days), Expired
- Alert banners for expiring and expired contracts
- Search and filter by status
- Contract cards with days until expiry, tenant score, lease dates, rent amount

---

## 9. Design System

### 9.1 Color Palette

The design uses an Islamic Bengali color palette:

| Name | Hex | Usage |
|---|---|---|
| Emerald | #0D7C3D | Primary actions, paid status, positive indicators |
| Gold | #C5A028 | Accent, sidebar highlights, CTAs |
| Deep Teal | #0A5C4E | Sidebar background, secondary accent |
| Cream | #FFF8E7 | Page background |
| Terracotta | #C4653A | Expense indicators, warm accent |
| Bengali Green | #006A4E | Cultural accent (Bangladesh flag green) |
| Bengali Red | #C1272D | Cultural accent (Bangladesh flag red) |
| Islamic Gold | #D4AF37 | Decorative gold |
| Deep Maroon | #800020 | Chart accent |
| Warm Saffron | #F4C430 | Chart accent |

### 9.2 Islamic Geometric Patterns

The sidebar and login page use CSS-only Islamic geometric patterns created with layered `radial-gradient` and `linear-gradient` backgrounds, inspired by 8-pointed star motifs and Bengali nakshi kantha embroidery patterns.

### 9.3 Animations

- `overdue-pulse`: Pulsing animation for overdue alerts
- `animate-fade-in-up`: Fade in with upward slide
- `stagger-children`: Sequential animation delay for child elements
- `card-hover`: Subtle lift on hover with shadow

### 9.4 Custom CSS Classes

- `.islamic-pattern` - Sidebar background pattern
- `.islamic-pattern-full` - Login page full-screen pattern
- `.status-paid/.status-overdue/.status-partial` - Glowing status borders
- `.bengali-accent` - Green-to-red gradient border (Bangladesh flag)
- `.geometric-divider` - Gold/teal repeating pattern divider
- `.islamic-border-top` - Decorative Islamic border
- `.custom-scrollbar` - Thin custom scrollbar

---

## 10. Deployment

### 10.1 Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

### 10.2 Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set framework to "Next.js" (critical - if not auto-detected, use Vercel API)
4. Deploy

**Important:** If Vercel shows 404 errors, the framework may not be detected. Fix via Vercel API:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/[PROJECT_ID]" \
  -H "Authorization: Bearer [VERCEL_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"framework": "nextjs"}'
```

### 10.3 Live URL

https://al-reef-al-junoobi.vercel.app

---

## 11. Environment Variables

| Variable | Value | Required |
|---|---|---|
| NEXT_PUBLIC_APP_NAME | Al Reef Al Janoubi Dashboard | No (used in metadata) |
| DATABASE_URL | file:./db/custom.db | No (not actively used) |

Note: The DATABASE_URL is defined in `.env.example` but the application uses localStorage via Zustand instead of a database.

---

## 12. Full Source Code

Below is the complete source code for every file in the project. Each file is presented in full with no truncation.

### package.json

```json
{
  "name": "al-reef-al-junoobi",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000 2>&1 | tee dev.log",
    "build": "next build",
    "start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log",
    "lint": "eslint ."
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^5.1.1",
    "@mdxeditor/editor": "^3.39.1",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@reactuses/core": "^6.0.5",
    "@tanstack/react-query": "^5.82.0",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.23.2",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.525.0",
    "next": "^16.1.1",
    "next-intl": "^4.3.4",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-day-picker": "^9.8.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.60.0",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^3.0.3",
    "react-syntax-highlighter": "^15.6.1",
    "recharts": "^2.15.4",
    "sharp": "^0.34.3",
    "sonner": "^2.0.6",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^11.1.0",
    "vaul": "^1.1.2",
    "z-ai-web-dev-sdk": "^0.0.17",
    "zod": "^4.0.2",
    "zustand": "^5.0.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "bun-types": "^1.3.4",
    "eslint": "^9",
    "eslint-config-next": "^16.1.1",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5",
    "typescript": "^5"
  }
}

```

---

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

```

---

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "noImplicitAny": false,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```

---

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;

```

---

### postcss.config.mjs

```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;

```

---

### eslint.config.mjs

```javascript
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;

```

---

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

### .env.example

```
# Database
DATABASE_URL=file:./db/custom.db

```

---

### .gitignore

```
# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
db/*.db
db/*.db-journal

# dev logs
dev.log
.zscripts/

```

---

### src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.",
  description: "Property Dashboard - Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

```

---

### src/app/page.tsx

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { t, rtlLanguages } from '@/lib/i18n'
import Login from '@/components/login'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/components/dashboard'
import Properties from '@/components/properties'
import Tenants from '@/components/tenants'
import RentCollection from '@/components/rent-collection'
import Maintenance from '@/components/maintenance'
import Expenses from '@/components/expenses'
import Reports from '@/components/reports'
import Contracts from '@/components/contracts'

export default function Home() {
  const { isAuthenticated, authUser, currentPage, sidebarOpen, language, setSidebarOpen } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  // Set direction based on language
  useEffect(() => {
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  // Handle responsive sidebar
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setSidebarOpen])

  // Show login page if not authenticated
  if (!isAuthenticated || !authUser) {
    return <Login />
  }

  const isFinancialUser = isOwnerOrAdmin(authUser.role)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'properties': return <Properties />
      case 'tenants': return <Tenants />
      case 'rent': return <RentCollection />
      case 'maintenance': return <Maintenance />
      case 'expenses': return isFinancialUser ? <Expenses /> : <AccessDenied />
      case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />
      case 'contracts': return <Contracts />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <main
        className="transition-all duration-300 min-h-screen"
        style={{
          marginLeft: !isMobile && sidebarOpen ? '256px' : isMobile ? '0' : '0',
        }}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

function AccessDenied() {
  const { language } = useAppStore()

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground">{t('accessDenied', language)}</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', language)}</p>
    </div>
  )
}

```

---

### src/app/globals.css

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Islamic Bengali Color Palette */
  --color-emerald: #0D7C3D;
  --color-gold: #C5A028;
  --color-cream: #FFF8E7;
  --color-deep-teal: #0A5C4E;
  --color-terracotta: #C4653A;
  --color-bengali-green: #006A4E;
  --color-bengali-red: #C1272D;
  --color-islamic-gold: #D4AF37;
  --color-deep-maroon: #800020;
  --color-warm-saffron: #F4C430;
}

:root {
  --radius: 0.625rem;
  --background: #FFF8E7;
  --foreground: #1a1a1a;
  --card: #ffffff;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;
  --primary: #0D7C3D;
  --primary-foreground: #ffffff;
  --secondary: #f0ebe0;
  --secondary-foreground: #1a1a1a;
  --muted: #f5f0e5;
  --muted-foreground: #6b7280;
  --accent: #C5A028;
  --accent-foreground: #ffffff;
  --destructive: #dc2626;
  --border: #e5e0d5;
  --input: #e5e0d5;
  --ring: #0D7C3D;
  --chart-1: #0D7C3D;
  --chart-2: #C5A028;
  --chart-3: #0A5C4E;
  --chart-4: #C4653A;
  --chart-5: #800020;
  --sidebar: #0A5C4E;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #C5A028;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #0D7C3D;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255,255,255,0.1);
  --sidebar-ring: #C5A028;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Islamic geometric pattern for sidebar - enhanced with Bengali influences */
.islamic-pattern {
  background-color: #0A5C4E;
  background-image:
    /* 8-pointed star pattern - Islamic geometric motif */
    radial-gradient(circle at 50% 50%, rgba(197,160,40,0.08) 0%, transparent 50%),
    /* Diagonal lattice - Arabesque */
    linear-gradient(30deg, rgba(197,160,40,0.06) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.06) 87.5%, rgba(197,160,40,0.06)),
    linear-gradient(150deg, rgba(197,160,40,0.06) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.06) 87.5%, rgba(197,160,40,0.06)),
    linear-gradient(30deg, rgba(197,160,40,0.06) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.06) 87.5%, rgba(197,160,40,0.06)),
    linear-gradient(150deg, rgba(197,160,40,0.06) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.06) 87.5%, rgba(197,160,40,0.06)),
    /* Bengali nakshi kantha inspired diagonal lines */
    linear-gradient(60deg, rgba(255,255,255,0.03) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03)),
    linear-gradient(60deg, rgba(255,255,255,0.03) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03));
  background-size: 80px 140px, 40px 70px, 40px 70px, 40px 70px, 40px 70px, 40px 70px, 40px 70px;
  background-position: 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px;
}

/* Full-page Islamic pattern for login */
.islamic-pattern-full {
  background-color: #0A5C4E;
  background-image:
    /* Central medallion effect */
    radial-gradient(ellipse at 50% 50%, rgba(197,160,40,0.12) 0%, transparent 60%),
    /* Geometric star grid */
    radial-gradient(circle at 25% 25%, rgba(197,160,40,0.06) 0%, transparent 30%),
    radial-gradient(circle at 75% 75%, rgba(197,160,40,0.06) 0%, transparent 30%),
    radial-gradient(circle at 75% 25%, rgba(212,175,55,0.04) 0%, transparent 25%),
    radial-gradient(circle at 25% 75%, rgba(212,175,55,0.04) 0%, transparent 25%),
    /* Arabesque lattice */
    linear-gradient(30deg, rgba(197,160,40,0.05) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.05) 87.5%),
    linear-gradient(150deg, rgba(197,160,40,0.05) 12%, transparent 12.5%, transparent 87%, rgba(197,160,40,0.05) 87.5%),
    /* Nakshi kantha embroidery inspired pattern */
    linear-gradient(60deg, rgba(255,255,255,0.02) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.02) 75%),
    linear-gradient(-60deg, rgba(128,0,32,0.03) 25%, transparent 25.5%, transparent 75%, rgba(128,0,32,0.03) 75%);
  background-size: 100% 100%, 120px 120px, 120px 120px, 80px 80px, 80px 80px, 50px 90px, 50px 90px, 50px 90px, 50px 90px;
}

/* Pulse animation for overdue alerts */
@keyframes overdue-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.overdue-pulse {
  animation: overdue-pulse 1.5s ease-in-out infinite;
}

/* Fade in up animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

/* Stagger children animation */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
.stagger-children > *:nth-child(8) { animation-delay: 0.4s; }
.stagger-children > *:nth-child(9) { animation-delay: 0.45s; }
.stagger-children > *:nth-child(10) { animation-delay: 0.5s; }
.stagger-children > *:nth-child(n+11) { animation-delay: 0.55s; }

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.25);
}

/* RTL support */
[dir="rtl"] {
  text-align: right;
}

/* Card hover effect */
.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Status card glow */
.status-paid {
  box-shadow: 0 0 0 2px #0D7C3D, 0 0 12px rgba(13,124,61,0.2);
}

.status-overdue {
  box-shadow: 0 0 0 2px #dc2626, 0 0 12px rgba(220,38,38,0.3);
}

.status-partial {
  box-shadow: 0 0 0 2px #f59e0b, 0 0 12px rgba(245,158,11,0.2);
}

/* Tenant score indicator */
.score-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.score-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: currentColor;
  border-right-color: currentColor;
}

/* Print styles for reports */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  body { background: white !important; }
}

/* Islamic decorative border */
.islamic-border-top {
  border-top: 3px solid transparent;
  border-image: repeating-linear-gradient(
    90deg,
    #C5A028 0px,
    #C5A028 8px,
    transparent 8px,
    transparent 12px,
    #0A5C4E 12px,
    #0A5C4E 20px,
    transparent 20px,
    transparent 24px
  ) 3;
}

/* Bengali cultural accent - subtle red-green border inspired by Bangladesh flag */
.bengali-accent {
  border-left: 3px solid;
  border-image: linear-gradient(to bottom, #006A4E, #C1272D) 1;
}

/* Geometric divider */
.geometric-divider {
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #C5A028 0px,
    #C5A028 6px,
    transparent 6px,
    transparent 10px,
    #0A5C4E 10px,
    #0A5C4E 16px,
    transparent 16px,
    transparent 20px
  );
}

```

---

### src/app/api/route.ts

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.' })
}

```

---

### src/lib/types.ts

```typescript
export type PageType = 'dashboard' | 'properties' | 'tenants' | 'rent' | 'maintenance' | 'expenses' | 'reports' | 'contracts'

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

---

### src/lib/i18n.ts

```typescript
// Al Reef Al Junoobi Real Estate - 4-Language i18n System
// EN = English, AR = Arabic, BN = Bengali, UR = Urdu
// Academic/professional translations, NOT literal

export type Language = 'en' | 'ar' | 'bn' | 'ur'

export const languageNames: Record<Language, { native: string; en: string }> = {
  en: { native: 'English', en: 'English' },
  ar: { native: 'العربية', en: 'Arabic' },
  bn: { native: 'বাংলা', en: 'Bengali' },
  ur: { native: 'اردو', en: 'Urdu' },
}

export const rtlLanguages: Language[] = ['ar', 'ur']

type TranslationKeys = typeof translations

export const translations = {
  // Auth
  login: { en: 'Sign In', ar: 'تسجيل الدخول', bn: 'সাইন ইন', ur: 'سائن ان' },
  loginTitle: { en: 'Property Dashboard', ar: 'لوحة التحكم العقارية', bn: 'সম্পত্তি ড্যাশবোর্ড', ur: 'پراپرٹی ڈیش بورڈ' },
  loginSubtitle: { en: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.', ar: 'الريف الجنوبي للعقارات والصيانة العامة ذ.م.م', bn: 'আল রিফ আল জুনুবি রিয়েল এস্টেট অ্যান্ড জেনারেল মেইনটেন্যান্স এলএলসি', ur: 'الریف الجنوبی ریئل اسٹیٹ اینڈ جنرل مینٹیننس لمیٹڈ' },
  email: { en: 'Email Address', ar: 'البريد الإلكتروني', bn: 'ইমেইল ঠিকানা', ur: 'ای میل ایڈریس' },
  password: { en: 'Password', ar: 'كلمة المرور', bn: 'পাসওয়ার্ড', ur: 'پاس ورڈ' },
  signInButton: { en: 'Sign In', ar: 'دخول', bn: 'সাইন ইন', ur: 'سائن ان' },
  loginError: { en: 'Invalid email or password', ar: 'بريد إلكتروني أو كلمة مرور غير صحيحة', bn: 'অবৈধ ইমেইল বা পাসওয়ার্ড', ur: 'غلط ای میل یا پاس ورڈ' },
  logout: { en: 'Sign Out', ar: 'تسجيل الخروج', bn: 'সাইন আউট', ur: 'سائن آؤٹ' },
  ownerRole: { en: 'Owner', ar: 'المالك', bn: 'মালিক', ur: 'مالک' },
  adminRole: { en: 'Admin', ar: 'المدير', bn: 'প্রশাসক', ur: 'ایڈمن' },
  staffRole: { en: 'Staff', ar: 'الموظف', bn: 'কর্মচারী', ur: 'اسٹاف' },

  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم', bn: 'ড্যাশবোর্ড', ur: 'ڈیش بورڈ' },
  properties: { en: 'Properties', ar: 'العقارات', bn: 'সম্পত্তি', ur: 'پراپرٹیز' },
  tenants: { en: 'Tenants', ar: 'المستأجرون', bn: 'ভাড়াটিয়া', ur: 'کرایہ دار' },
  rentCollection: { en: 'Rent Collection', ar: 'تحصيل الإيجار', bn: 'ভাড়া আদায়', ur: 'کرایہ وصولی' },
  maintenance: { en: 'Maintenance', ar: 'الصيانة', bn: 'রক্ষণাবেক্ষণ', ur: 'دیکھ بھال' },
  expenses: { en: 'Expenses', ar: 'المصروفات', bn: 'ব্যয়', ur: 'اخراجات' },
  reports: { en: 'Reports', ar: 'التقارير', bn: 'প্রতিবেদন', ur: 'رپورٹس' },
  contracts: { en: 'Contracts', ar: 'العقود', bn: 'চুক্তি', ur: 'معاہدے' },

  // Dashboard
  monthlyOverview: { en: 'Monthly Overview', ar: 'نظرة شهرية', bn: 'মাসিক পরিদর্শন', ur: 'ماہانہ جائزہ' },
  collectedRevenue: { en: 'Collected Revenue', ar: 'الإيرادات المحصّلة', bn: 'আদায়কৃত রাজস্ব', ur: 'وصول شدہ آمدنی' },
  overdue: { en: 'Overdue', ar: 'متأخر', bn: 'বকেয়া', ur: 'باقاعدہ' },
  activeTenants: { en: 'Active Tenants', ar: 'المستأجرون النشطون', bn: 'সক্রিয় ভাড়াটিয়া', ur: 'فعال کرایہ دار' },
  occupancyRate: { en: 'Occupancy Rate', ar: 'نسبة الإشغال', bn: 'অধিভুক্তির হার', ur: 'قبضہ کی شرح' },
  expected: { en: 'Expected', ar: 'متوقع', bn: 'প্রত্যাশিত', ur: 'متوقع' },
  collected: { en: 'Collected', ar: 'محصّل', bn: 'আদায়কৃত', ur: 'وصول شدہ' },
  monthly: { en: 'Monthly', ar: 'شهري', bn: 'মাসিক', ur: 'ماہانہ' },
  ofExpected: { en: 'of', ar: 'من', bn: 'এর মধ্যে', ur: 'میں سے' },
  total: { en: 'Total', ar: 'إجمالي', bn: 'মোট', ur: 'کل' },
  totalUnits: { en: 'Total Units', ar: 'إجمالي الوحدات', bn: 'মোট ইউনিট', ur: 'کل یونٹس' },
  occupiedUnits: { en: 'Occupied Units', ar: 'الوحدات المشغولة', bn: 'অধিভুক্ত ইউনিট', ur: 'قبضہ شدہ یونٹس' },
  vacantUnits: { en: 'Vacant Units', ar: 'الوحدات الشاغرة', bn: 'শূন্য ইউনিট', ur: 'خالی یونٹس' },
  netProfit: { en: 'Net Profit', ar: 'صافي الربح', bn: 'নিট মুনাফা', ur: 'خالص منافع' },
  paymentStatusBoard: { en: 'Payment Status Board', ar: 'لوحة حالة الدفع', bn: 'পেমেন্ট স্ট্যাটাস বোর্ড', ur: 'ادائیگی کی حالت بورڈ' },
  revenueTrend: { en: 'Revenue Trend (6 Months)', ar: 'اتجاه الإيرادات (6 أشهر)', bn: 'রাজস্ব প্রবণতা (6 মাস)', ur: 'آمدنی کا رجحان (6 ماہ)' },
  recentPayments: { en: 'Recent Payments', ar: 'المدفوعات الأخيرة', bn: 'সাম্প্রতিক পেমেন্ট', ur: 'حالیہ ادائیگیاں' },
  noData: { en: 'No data found', ar: 'لا توجد بيانات', bn: 'কোনো তথ্য পাওয়া যায়নি', ur: 'کوئی ڈیٹا نہیں ملا' },
  loadSampleData: { en: 'Load Sample Data', ar: 'تحميل البيانات التجريبية', bn: 'নমুনা ডেটা লোড করুন', ur: 'نمونہ ڈیٹا لوڈ کریں' },
  overdueAlert: { en: 'TENANT(S) OVERDUE', ar: 'مستأجر متأخر', bn: 'জন ভাড়াটিয়া বকেয়াদার', ur: 'کرایہ دار باقاعدہ' },
  uncollected: { en: 'UNCOLLECTED', ar: 'غير محصّل', bn: 'অনাদায়কৃত', ur: 'غیر وصول شدہ' },
  viewDetails: { en: 'View Details', ar: 'عرض التفاصيل', bn: 'বিস্তারিত দেখুন', ur: 'تفصیلات دیکھیں' },
  paid: { en: 'PAID', ar: 'مدفوع', bn: 'পরিশোধিত', ur: 'ادائیگی شدہ' },
  partial: { en: 'PARTIAL', ar: 'جزئي', bn: 'আংশিক', ur: 'جزوی' },
  inactive: { en: 'INACTIVE', ar: 'غير نشط', bn: 'নিষ্ক্রিয়', ur: 'غیر فعال' },
  dueSoon: { en: 'DUE SOON', ar: 'مستحق قريباً', bn: 'শীঘ্রই দেয়', ur: 'جلد ادائیگی' },
  remind: { en: 'Remind', ar: 'تذكير', bn: 'স্মরণ', ur: 'یاد دہانی' },
  remindAllUnpaid: { en: 'Remind All Unpaid', ar: 'تذكير الكل', bn: 'সকল অবৈতনিকে স্মরণ করুন', ur: 'سب کو یاد دہانی' },
  noRecentPayments: { en: 'No recent payments', ar: 'لا توجد مدفوعات حديثة', bn: 'কোনো সাম্প্রতিক পেমেন্ট নেই', ur: 'کوئی حالیہ ادائیگی نہیں' },

  // Properties
  addProperty: { en: 'Add Property', ar: 'إضافة عقار', bn: 'সম্পত্তি যোগ করুন', ur: 'پراپرٹی شامل کریں' },
  editProperty: { en: 'Edit Property', ar: 'تعديل العقار', bn: 'সম্পত্তি সম্পাদনা', ur: 'پراپرٹی ترمیم' },
  propertyName: { en: 'Property Name', ar: 'اسم العقار', bn: 'সম্পত্তির নাম', ur: 'پراپرٹی کا نام' },
  propertyType: { en: 'Property Type', ar: 'نوع العقار', bn: 'সম্পত্তির ধরন', ur: 'پراپرٹی کی قسم' },
  address: { en: 'Address', ar: 'العنوان', bn: 'ঠিকানা', ur: 'پتہ' },
  totalUnitsCount: { en: 'Total Units', ar: 'إجمالي الوحدات', bn: 'মোট ইউনিট', ur: 'کل یونٹس' },
  floors: { en: 'Floors', ar: 'الطوابق', bn: 'তলা', ur: 'منزلیں' },
  units: { en: 'Units', ar: 'وحدات', bn: 'ইউনিট', ur: 'یونٹس' },
  tenantsCount: { en: 'Tenants', ar: 'مستأجرون', bn: 'ভাড়াটিয়া', ur: 'کرایہ دار' },
  occupancy: { en: 'Occupancy', ar: 'إشغال', bn: 'অধিভুক্তি', ur: 'قبضہ' },
  monthlyRevenue: { en: 'Monthly Revenue', ar: 'الإيراد الشهري', bn: 'মাসিক রাজস্ব', ur: 'ماہانہ آمدنی' },
  propertiesManaged: { en: 'properties managed', ar: 'عقارات مُدارة', bn: 'টি পরিচালিত সম্পত্তি', ur: 'پراپرٹیز منیجڈ' },
  deleteProperty: { en: 'Delete this property?', ar: 'حذف هذا العقار؟', bn: 'এই সম্পত্তি মুছে ফেলবেন?', ur: 'یہ پراپرٹی حذف کریں؟' },
  archiveProperty: { en: 'Archive Property', ar: 'أرشفة العقار', bn: 'সম্পত্তি সংরক্ষণাগার', ur: 'پراپرٹی آرکائیو' },
  sellProperty: { en: 'Property Sold / Removed', ar: 'عقار مباع / مزال', bn: 'সম্পত্তি বিক্রয়/অপসারিত', ur: 'پراپرٹی فروخت/ہٹا دی' },
  apartment: { en: 'Apartment', ar: 'شقة', bn: 'অ্যাপার্টমেন্ট', ur: 'اپارٹمنٹ' },
  villa: { en: 'Villa', ar: 'فيلا', bn: 'ভিলা', ur: 'ولا' },
  office: { en: 'Office', ar: 'مكتب', bn: 'অফিস', ur: 'دفتر' },
  shop: { en: 'Shop', ar: 'محل', bn: 'দোকান', ur: 'دکان' },
  studio: { en: 'Studio', ar: 'استوديو', bn: 'স্টুডিও', ur: 'اسٹوڈیو' },
  mixedUse: { en: 'Mixed Use', ar: 'استخدام متعدد', bn: 'মিশ্র ব্যবহার', ur: 'مخلوط استعمال' },

  // Tenants
  addTenant: { en: 'Add Tenant', ar: 'إضافة مستأجر', bn: 'ভাড়াটিয়া যোগ করুন', ur: 'کرایہ دار شامل کریں' },
  editTenant: { en: 'Edit Tenant', ar: 'تعديل المستأجر', bn: 'ভাড়াটিয়া সম্পাদনা', ur: 'کرایہ دار ترمیم' },
  tenantName: { en: 'Tenant Name', ar: 'اسم المستأجر', bn: 'ভাড়াটিয়ার নাম', ur: 'کرایہ دار کا نام' },
  phone: { en: 'Phone', ar: 'الهاتف', bn: 'ফোন', ur: 'فون' },
  whatsapp: { en: 'WhatsApp', ar: 'واتساب', bn: 'হোয়াটসঅ্যাপ', ur: 'واٹس ایپ' },
  emiratesId: { en: 'Emirates ID', ar: 'الهوية الإماراتية', bn: 'আমিরাতি পরিচয়পত্র', ur: 'اماراتی شناختی کارڈ' },
  nationality: { en: 'Nationality', ar: 'الجنسية', bn: 'জাতীয়তা', ur: 'قومیت' },
  employer2: { en: 'Employer', ar: 'جهة العمل', bn: 'নিয়োগকর্তা', ur: 'آجروں' },
  emergencyContact: { en: 'Emergency Contact', ar: 'جهة اتصال الطوارئ', bn: 'জরুরি যোগাযোগ', ur: 'ہنگامی رابطہ' },
  unitNumber: { en: 'Unit Number', ar: 'رقم الوحدة', bn: 'ইউনিট নম্বর', ur: 'یونٹ نمبر' },
  unitType: { en: 'Unit Type', ar: 'نوع الوحدة', bn: 'ইউনিটের ধরন', ur: 'یونٹ کی قسم' },
  floor2: { en: 'Floor', ar: 'الطابق', bn: 'তলা', ur: 'منزل' },
  sizeSqft: { en: 'Size (sqft)', ar: 'المساحة (قدم مربع)', bn: 'আকার (বর্গফুট)', ur: 'سائز (مربع فٹ)' },
  monthlyRent: { en: 'Monthly Rent (AED)', ar: 'الإيجار الشهري (درهم)', bn: 'মাসিক ভাড়া (দিরহাম)', ur: 'ماہانہ کرایہ (درہم)' },
  municipalityFee: { en: 'Municipality Fee (5%)', ar: 'رسوم البلدية (5%)', bn: 'পৌরসভা ফি (5%)', ur: 'بلدیہ فیس (5%)' },
  securityDeposit: { en: 'Security Deposit', ar: 'التأمين', bn: 'নিরাপত্তা জমা', ur: 'سیکیورٹی ڈپازٹ' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع', bn: 'পেমেন্ট পদ্ধতি', ur: 'ادائیگی کا طریقہ' },
  leaseStart: { en: 'Lease Start', ar: 'بداية العقد', bn: 'লিজ শুরু', ur: 'لیز کی شروعات' },
  leaseEnd: { en: 'Lease End', ar: 'نهاية العقد', bn: 'লিজ শেষ', ur: 'لیز کا ختم' },
  contractDuration: { en: 'Contract Duration (months)', ar: 'مدة العقد (أشهر)', bn: 'চুক্তির মেয়াদ (মাস)', ur: 'معاہدے کی مدت (مہینے)' },
  status: { en: 'Status', ar: 'الحالة', bn: 'অবস্থা', ur: 'حالت' },
  active: { en: 'Active', ar: 'نشط', bn: 'সক্রিয়', ur: 'فعال' },
  inactive2: { en: 'Inactive', ar: 'غير نشط', bn: 'নিষ্ক্রিয়', ur: 'غیر فعال' },
  evicted: { en: 'Evicted', ar: 'مُخلَى', bn: 'উচ্ছেদিত', ur: 'بے دخل' },
  notice: { en: 'Notice Period', ar: 'فترة الإشعار', bn: 'নোটিশ পিরিয়ড', ur: 'نوٹس پیریڈ' },
  tenantScore: { en: 'Tenant Score', ar: 'تقييم المستأجر', bn: 'ভাড়াটিয়া স্কোর', ur: 'کرایہ دار اسکور' },
  latePayments: { en: 'Late Payments', ar: 'مدفوعات متأخرة', bn: 'বিলম্বিত পেমেন্ট', ur: 'تاخیری ادائیگیاں' },
  paymentHistory: { en: 'Payment History', ar: 'سجل المدفوعات', bn: 'পেমেন্ট ইতিহাস', ur: 'ادائیگی کی تاریخ' },
  searchTenants: { en: 'Search tenants...', ar: 'بحث المستأجرين...', bn: 'ভাড়াটিয়া খুঁজুন...', ur: 'کرایہ دار تلاش کریں...' },
  allStatus: { en: 'All Status', ar: 'كل الحالات', bn: 'সকল অবস্থা', ur: 'تمام حالتیں' },
  deleteTenant: { en: 'Delete this tenant and all their payments?', ar: 'حذف هذا المستأجر وجميع مدفوعاته؟', bn: 'এই ভাড়াটিয়া এবং তাদের সকল পেমেন্ট মুছে ফেলবেন?', ur: 'یہ کرایہ دار اور ان کی تمام ادائیگیاں حذف کریں؟' },
  noPayments: { en: 'No payments recorded', ar: 'لا توجد مدفوعات', bn: 'কোনো পেমেন্ট রেকর্ড নেই', ur: 'کوئی ادائیگی ریکارڈ نہیں' },
  noTenantsFound: { en: 'No tenants found', ar: 'لم يتم العثور على مستأجرين', bn: 'কোনো ভাড়াটিয়া পাওয়া যায়নি', ur: 'کوئی کرایہ دار نہیں ملا' },
  scoreExcellent: { en: 'Excellent', ar: 'ممتاز', bn: 'চমৎকার', ur: 'بہترین' },
  scoreGood: { en: 'Good', ar: 'جيد', bn: 'ভালো', ur: 'اچھا' },
  scoreWarning: { en: 'Warning', ar: 'تحذير', bn: 'সতর্কতা', ur: 'انتباہ' },
  scorePoor: { en: 'Poor', ar: 'ضعيف', bn: 'দুর্বল', ur: 'کمزور' },
  cash: { en: 'Cash', ar: 'نقدي', bn: 'নগদ', ur: 'نقد' },
  bankTransfer: { en: 'Bank Transfer', ar: 'تحويل بنكي', bn: 'ব্যাংক ট্রান্সফার', ur: 'بینک ٹرانسفر' },
  cheque: { en: 'Cheque', ar: 'شيك', bn: 'চেক', ur: 'چیک' },
  nameEnglish: { en: 'Name (English)', ar: 'الاسم (إنجليزي)', bn: 'নাম (ইংরেজি)', ur: 'نام (انگریزی)' },
  nameArabic: { en: 'Arabic Name', ar: 'الاسم بالعربية', bn: 'আরবি নাম', ur: 'عربی نام' },
  nameBengali: { en: 'Bengali Name', ar: 'الاسم بالبنغالية', bn: 'বাংলা নাম', ur: 'بنگالی نام' },
  nameUrdu: { en: 'Urdu Name', ar: 'الاسم بالأردية', bn: 'উর্দু নাম', ur: 'اردو نام' },
  oneBedroom: { en: '1 Bedroom', ar: 'غرفة واحدة', bn: '১ বেডরুম', ur: '1 بیڈ روم' },
  twoBedroom: { en: '2 Bedroom', ar: 'غرفتان', bn: '২ বেডরুম', ur: '2 بیڈ روم' },
  threeBedroom: { en: '3 Bedroom', ar: '3 غرف', bn: '৩ বেডরুম', ur: '3 بیڈ روم' },
  selectProperty: { en: 'Select Property', ar: 'اختر العقار', bn: 'সম্পত্তি নির্বাচন', ur: 'پراپرٹی منتخب کریں' },
  tenantProfile: { en: 'Tenant Profile', ar: 'ملف المستأجر', bn: 'ভাড়াটিয়া প্রোফাইল', ur: 'کرایہ دار پروفائل' },
  personalInfo: { en: 'Personal Information', ar: 'المعلومات الشخصية', bn: 'ব্যক্তিগত তথ্য', ur: 'ذاتی معلومات' },
  contactInfo: { en: 'Contact Information', ar: 'معلومات الاتصال', bn: 'যোগাযোগ তথ্য', ur: 'رابطہ کی معلومات' },
  leaseInfo: { en: 'Lease Information', ar: 'معلومات العقد', bn: 'লিজ তথ্য', ur: 'لیز کی معلومات' },
  financialInfo: { en: 'Financial Information', ar: 'المعلومات المالية', bn: 'আর্থিক তথ্য', ur: 'مالیاتی معلومات' },
  months: { en: 'months', ar: 'أشهر', bn: 'মাস', ur: 'مہینے' },
  late: { en: 'Late', ar: 'متأخر', bn: 'বিলম্বিত', ur: 'تاخیر' },
  onTime: { en: 'On Time', ar: 'في الوقت', bn: 'সময়মতো', ur: 'بوقت' },
  building: { en: 'Building', ar: 'المبنى', bn: 'ভবন', ur: 'عمارت' },
  autoCalc: { en: 'Auto-calculated (5% of rent)', ar: 'حساب تلقائي (5% من الإيجار)', bn: 'স্বয়ংক্রিয় গণনা (ভাড়ার 5%)', ur: 'خودکار حساب (کرایے کا 5%)' },

  // Rent Collection
  rent: { en: 'Rent', ar: 'الإيجار', bn: 'ভাড়া', ur: 'کرایہ' },
  remaining: { en: 'Remaining', ar: 'المتبقي', bn: 'বাকি', ur: 'باقی' },
  markPaid: { en: 'Mark Paid', ar: 'تسجيل دفع', bn: 'পরিশোধিত চিহ্ন', ur: 'ادائیگی کا نشان' },
  recordPayment: { en: 'Record Payment', ar: 'تسجيل دفعة', bn: 'পেমেন্ট রেকর্ড করুন', ur: 'ادائیگی ریکارڈ کریں' },
  amount: { en: 'Amount (AED)', ar: 'المبلغ (درهم)', bn: 'পরিমাণ (দিরহাম)', ur: 'رقم (درہم)' },
  reference: { en: 'Reference / Receipt No.', ar: 'المرجع / رقم الإيصال', bn: 'রেফারেন্স / রশিদ নম্বর', ur: 'حوالہ / رسید نمبر' },
  notes: { en: 'Notes', ar: 'ملاحظات', bn: 'নোট', ur: 'نوٹس' },
  confirmPayment: { en: 'Confirm Payment', ar: 'تأكيد الدفع', bn: 'পেমেন্ট নিশ্চিত করুন', ur: 'ادائیگی کی تصدیق' },
  cancel: { en: 'Cancel', ar: 'إلغاء', bn: 'বাতিল', ur: 'منسوخ' },
  save: { en: 'Save', ar: 'حفظ', bn: 'সংরক্ষণ', ur: 'محفوظ کریں' },
  all: { en: 'All', ar: 'الكل', bn: 'সব', ur: 'سب' },
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع', bn: 'অবৈতনিক', ur: 'غیر ادا شدہ' },
  collectionProgress: { en: 'Collection Progress', ar: 'تقدم التحصيل', bn: 'আদায় অগ্রগতি', ur: 'وصولی کی پیش رفت' },
  noTenantsMatchFilter: { en: 'No tenants match the filter', ar: 'لا يوجد مستأجرون مطابقون للفلتر', bn: 'কোনো ভাড়াটিয়া ফিল্টারে মেলেনি', ur: 'کوئی کرایہ دار فلٹر سے مطابق نہیں' },
  sendWhatsAppReminder: { en: 'Send WhatsApp Reminder', ar: 'إرسال تذكير واتساب', bn: 'হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান', ur: 'واٹس ایپ یاد دہانی بھیجیں' },

  // Maintenance
  addTask: { en: 'Add Task', ar: 'إضافة مهمة', bn: 'কাজ যোগ করুন', ur: 'ٹاسک شامل کریں' },
  editTask: { en: 'Edit Task', ar: 'تعديل المهمة', bn: 'কাজ সম্পাদনা', ur: 'ٹاسک ترمیم' },
  pending: { en: 'Pending', ar: 'قيد الانتظار', bn: 'অপেক্ষমাণ', ur: 'زیر التواء' },
  inProgress: { en: 'In Progress', ar: 'قيد التنفيذ', bn: 'চলমান', ur: 'جاری ہے' },
  completed: { en: 'Completed', ar: 'مكتمل', bn: 'সম্পন্ন', ur: 'مکمل' },
  urgent: { en: 'Urgent', ar: 'عاجل', bn: 'জরুরি', ur: 'فوری' },
  high: { en: 'High', ar: 'مرتفع', bn: 'উচ্চ', ur: 'زیادہ' },
  medium: { en: 'Medium', ar: 'متوسط', bn: 'মাঝারি', ur: 'درمیانہ' },
  low: { en: 'Low', ar: 'منخفض', bn: 'নিম্ন', ur: 'کم' },
  title: { en: 'Title', ar: 'العنوان', bn: 'শিরোনাম', ur: 'عنوان' },
  description: { en: 'Description', ar: 'الوصف', bn: 'বিবরণ', ur: 'تفصیل' },
  priority: { en: 'Priority', ar: 'الأولوية', bn: 'অগ্রাধিকার', ur: 'ترجیح' },
  estimatedCost: { en: 'Estimated Cost (AED)', ar: 'التكلفة المقدرة (درهم)', bn: 'আনুমানিক খরচ (দিরহাম)', ur: 'تخمینی لاگت (درہم)' },
  actualCost: { en: 'Actual Cost (AED)', ar: 'التكلفة الفعلية (درهم)', bn: 'প্রকৃত খরচ (দিরহাম)', ur: 'اصل لاگت (درہم)' },
  vendor: { en: 'Vendor/Technician', ar: 'المورد/الفني', bn: 'বিক্রেতা/প্রযুক্তিবিদ', ur: 'وینڈر/ٹیکنیشن' },
  category: { en: 'Category', ar: 'الفئة', bn: 'বিভাগ', ur: 'زمرہ' },
  noTasks: { en: 'No tasks', ar: 'لا مهام', bn: 'কোনো কাজ নেই', ur: 'کوئی ٹاسک نہیں' },
  deleteTask: { en: 'Delete this task?', ar: 'حذف هذه المهمة؟', bn: 'এই কাজ মুছে ফেলবেন?', ur: 'یہ ٹاسک حذف کریں؟' },
  start: { en: 'Start', ar: 'بدء', bn: 'শুরু', ur: 'شروع' },
  complete: { en: 'Complete', ar: 'إكمال', bn: 'সম্পূর্ণ', ur: 'مکمل' },
  ac: { en: 'AC', ar: 'تكييف', bn: 'এসি', ur: 'ایئر کنڈیشنر' },
  plumbing: { en: 'Plumbing', ar: 'سباكة', bn: 'প্লাম্বিং', ur: 'پلمبنگ' },
  electrical: { en: 'Electrical', ar: 'كهرباء', bn: 'বৈদ্যুতিক', ur: 'بجلی' },
  lockDoor: { en: 'Lock/Door', ar: 'قفل/باب', bn: 'তালা/দরজা', ur: 'تالا/دروازہ' },
  painting: { en: 'Painting', ar: 'دهان', bn: 'রং', ur: 'پینٹنگ' },
  structural: { en: 'Structural', ar: 'هيكلي', bn: 'কাঠামোগত', ur: 'ساختی' },
  other: { en: 'Other', ar: 'أخرى', bn: 'অন্যান্য', ur: 'دیگر' },

  // Expenses
  addExpense: { en: 'Add Expense', ar: 'إضافة مصروف', bn: 'ব্যয় যোগ করুন', ur: 'اخراجات شامل کریں' },
  editExpense: { en: 'Edit Expense', ar: 'تعديل المصروف', bn: 'ব্যয় সম্পাদনা', ur: 'اخراجات ترمیم' },
  expenseCategory: { en: 'Category', ar: 'الفئة', bn: 'বিভাগ', ur: 'زمرہ' },
  totalExpenses: { en: 'Total Expenses', ar: 'إجمالي المصروفات', bn: 'মোট ব্যয়', ur: 'کل اخراجات' },
  thisMonth: { en: 'This Month', ar: 'هذا الشهر', bn: 'এই মাস', ur: 'اس مہینے' },
  recurring: { en: 'Recurring', ar: 'متكرر', bn: 'পুনরাবৃত্তি', ur: 'بار بار' },
  oneTime: { en: 'One-time', ar: 'مرة واحدة', bn: 'এককালীন', ur: 'ایک بار' },
  manpower: { en: 'Manpower/Staff', ar: 'القوى العاملة/الموظفين', bn: 'শ্রমিক/কর্মী', ur: 'افراد/اسٹاف' },
  municipalityFees: { en: 'Municipality Fees', ar: 'رسوم البلدية', bn: 'পৌরসভা ফি', ur: 'بلدیہ فیس' },
  maintenance2: { en: 'Maintenance', ar: 'الصيانة', bn: 'রক্ষণাবেক্ষণ', ur: 'دیکھ بھال' },
  utilities: { en: 'Utilities', ar: 'المرافق', bn: 'ইউটিলিটি', ur: 'سہولیات' },
  leasingCommission: { en: 'Leasing Commission', ar: 'عمولة التأجير', bn: 'লিজিং কমিশন', ur: 'لیزنگ کمیشن' },
  insurance: { en: 'Insurance', ar: 'التأمين', bn: 'বীমা', ur: 'انشورنس' },
  security: { en: 'Security', ar: 'الأمن', bn: 'নিরাপত্তা', ur: 'سیکیورٹی' },
  deleteExpense: { en: 'Delete this expense?', ar: 'حذف هذا المصروف؟', bn: 'এই ব্যয় মুছে ফেলবেন?', ur: 'یہ اخراجات حذف کریں؟' },

  // Reports (Owner/Admin only)
  monthlyReport: { en: 'Monthly Report', ar: 'التقرير الشهري', bn: 'মাসিক প্রতিবেদন', ur: 'ماہانہ رپورٹ' },
  revenueAnalysis: { en: 'Revenue Analysis', ar: 'تحليل الإيرادات', bn: 'রাজস্ব বিশ্লেষণ', ur: 'آمدنی کا تجزیہ' },
  profitAndLoss: { en: 'Profit & Loss', ar: 'الأرباح والخسائر', bn: 'লাভ ও ক্ষতি', ur: 'منافع اور نقصان' },
  rentalIncome: { en: 'Rental Income', ar: 'دخل الإيجارات', bn: 'ভাড়া আয়', ur: 'کرایے کی آمدنی' },
  otherIncome: { en: 'Other Income', ar: 'دخل آخر', bn: 'অন্যান্য আয়', ur: 'دیگر آمدنی' },
  grossRevenue: { en: 'Gross Revenue', ar: 'الإيرادات الإجمالية', bn: 'সমষ্টিগত রাজস্ব', ur: 'کل آمدنی' },
  netRevenue: { en: 'Net Revenue', ar: 'الإيرادات الصافية', bn: 'নিট রাজস্ব', ur: 'خالص آمدنی' },
  vacancyLoss: { en: 'Vacancy Loss', ar: 'خسارة الشغور', bn: 'শূন্যতা ক্ষতি', ur: 'خالی جگہ کا نقصان' },
  badDebt: { en: 'Bad Debt / Unpaid', ar: 'ديون معدومة / غير مدفوعة', bn: 'খেলাপি ঋণ / অবৈতনিক', ur: 'خراب قرضہ / غیر ادا شدہ' },
  costOfOperations: { en: 'Cost of Operations', ar: 'تكلفة العمليات', bn: 'পরিচালন ব্যয়', ur: 'آپریشن کی لاگت' },
  collectionRate: { en: 'Collection Rate', ar: 'نسبة التحصيل', bn: 'আদায় হার', ur: 'وصولی کی شرح' },

  // Contracts
  contractTracker: { en: 'Contract Tracker', ar: 'متتبع العقود', bn: 'চুক্তি ট্র্যাকার', ur: 'معاہدہ ٹریکر' },
  expiringSoon: { en: 'Expiring Soon', ar: 'ينتهي قريباً', bn: 'শীঘ্রই মেয়াদ শেষ', ur: 'جلد ختم ہو رہا' },
  expired: { en: 'Expired', ar: 'منتهي', bn: 'মেয়াদোত্তীর্ণ', ur: 'ختم شدہ' },
  renewed: { en: 'Renewed', ar: 'مجدّد', bn: 'নবায়নকৃত', ur: 'تجدید شدہ' },
  terminated: { en: 'Terminated', ar: 'ملغى', bn: 'বাতিল', ur: 'ختم شدہ' },
  daysUntilExpiry: { en: 'Days Until Expiry', ar: 'أيام حتى الانتهاء', bn: 'মেয়াদ শেষ পর্যন্ত দিন', ur: 'اختتام تک دن' },
  renewalStatus: { en: 'Renewal Status', ar: 'حالة التجديد', bn: 'নবায়ন অবস্থা', ur: 'تجدید کی حالت' },
  newRent: { en: 'New Rent (AED)', ar: 'الإيجار الجديد (درهم)', bn: 'নতুন ভাড়া (দিরহাম)', ur: 'نیا کرایہ (درہم)' },
  noContracts: { en: 'No contracts found', ar: 'لا توجد عقود', bn: 'কোনো চুক্তি পাওয়া যায়নি', ur: 'کوئی معاہدہ نہیں ملا' },

  // General
  actions: { en: 'Actions', ar: 'إجراءات', bn: 'কার্যক্রম', ur: 'اقدامات' },
  select: { en: 'Select', ar: 'اختر', bn: 'নির্বাচন', ur: 'منتخب' },
  none: { en: 'None', ar: 'بدون', bn: 'কোনোটিই নয়', ur: 'کوئی نہیں' },
  language: { en: 'Language', ar: 'اللغة', bn: 'ভাষা', ur: 'زبان' },
  lastPayment: { en: 'Last Payment', ar: 'آخر دفعة', bn: 'শেষ পেমেন্ট', ur: 'آخری ادائیگی' },
  propertyUnit: { en: 'Property / Unit', ar: 'العقار / الوحدة', bn: 'সম্পত্তি / ইউনিট', ur: 'پراپرٹی / یونٹ' },
  loading: { en: 'Loading...', ar: 'جارٍ التحميل...', bn: 'লোড হচ্ছে...', ur: 'لوڈ ہو رہا ہے...' },
  noResults: { en: 'No results found', ar: 'لم يتم العثور على نتائج', bn: 'কোনো ফলাফল পাওয়া যায়নি', ur: 'کوئی نتیجہ نہیں ملا' },
  vacateUnit: { en: 'Vacate Unit', ar: 'إخلاء الوحدة', bn: 'ইউনিট খালি করুন', ur: 'یونٹ خالی کریں' },
  addBuilding: { en: 'Add Building', ar: 'إضافة مبنى', bn: 'ভবন যোগ করুন', ur: 'عمارت شامل کریں' },
  propertySoldInfo: { en: 'When a building is sold or removed, it can be archived. Data is preserved for historical reports.', ar: 'عند بيع أو إزالة مبنى، يمكن أرشفته. يتم حفظ البيانات للتقارير التاريخية.', bn: 'কোনো ভবন বিক্রি বা অপসারিত হলে, এটি সংরক্ষণাগারে রাখা যায়। ঐতিহাসিক প্রতিবেদনের জন্য ডেটা সংরক্ষিত থাকে।', ur: 'جب عمارت فروخت یا ہٹا دی جاتی ہے، تو اسے آرکائیو کیا جا سکتا ہے۔ تاریخی رپورٹس کے لیے ڈیٹا محفوظ رہتا ہے۔' },
  accessDenied: { en: 'Access Denied - Financial data is only visible to Owner/Admin', ar: 'تم رفض الوصول - البيانات المالية مرئية فقط للمالك/المدير', bn: 'অ্যাক্সেস অস্বীকৃত - আর্থিক তথ্য শুধুমাত্র মালিক/প্রশাসকের দৃশ্যমান', ur: 'رسائی مسترد - مالیاتی ڈیٹا صرف مالک/ایڈمن کو نظر آتا ہے' },
  financialDataProtected: { en: 'Financial data is protected and only visible to the business owner and admin.', ar: 'البيانات المالية محمية ومرئية فقط لصاحب العمل والمدير.', bn: 'আর্থিক তথ্য সুরক্ষিত এবং শুধুমাত্র ব্যবসার মালিক এবং প্রশাসকের দৃশ্যমান।', ur: 'مالیاتی ڈیٹا محفوظ ہے اور صرف کاروبار کے مالک اور ایڈمن کو نظر آتا ہے۔' },

  // Additional keys for Maintenance, Expenses, Reports
  invoiceNumber: { en: 'Invoice Number', ar: 'رقم الفاتورة', bn: 'চালান নম্বর', ur: 'انوائس نمبر' },
  printReport: { en: 'Print Report', ar: 'طباعة التقرير', bn: 'প্রতিবেদন মুদ্রণ', ur: 'رپورٹ پرنٹ کریں' },
  thisMonthTotal: { en: 'This Month Total', ar: 'إجمالي هذا الشهر', bn: 'এই মাসের মোট', ur: 'اس مہینے کا کل' },
  expenseDetails: { en: 'Expense Details', ar: 'تفاصيل المصروفات', bn: 'ব্যয়ের বিস্তারিত', ur: 'اخراجات کی تفصیلات' },
  noExpensesMonth: { en: 'No expenses this month', ar: 'لا مصروفات هذا الشهر', bn: 'এই মাসে কোনো ব্যয় নেই', ur: 'اس مہینے کوئی اخراجات نہیں' },
  revenue: { en: 'Revenue', ar: 'الإيرادات', bn: 'রাজস্ব', ur: 'آمدنی' },
  profitOrLoss: { en: 'Profit / Loss', ar: 'الربح / الخسارة', bn: 'লাভ / ক্ষতি', ur: 'منافع / نقصان' },
  sixMonthTrend: { en: '6-Month Trend', ar: 'اتجاه 6 أشهر', bn: '6-মাস প্রবণতা', ur: '6 ماہ کا رجحان' },
  date: { en: 'Date', ar: 'التاريخ', bn: 'তারিখ', ur: 'تاریخ' },
  noExpensesFound: { en: 'No expenses found', ar: 'لم يتم العثور على مصروفات', bn: 'কোনো ব্যয় পাওয়া যায়নি', ur: 'کوئی اخراجات نہیں ملا' },
  expenseBreakdown: { en: 'Expense Breakdown', ar: 'توزيع المصروفات', bn: 'ব্যয় বিশ্লেষণ', ur: 'اخراجات کی تقسیم' },
  monthlyTrend: { en: 'Monthly Trend', ar: 'الاتجاه الشهري', bn: 'মাসিক প্রবণতা', ur: 'ماہانہ رجحان' },
  tasksCount: { en: 'tasks', ar: 'مهام', bn: 'টি কাজ', ur: 'ٹاسکس' },
  expensesCount: { en: 'expenses tracked', ar: 'مصروفات مسجلة', bn: 'টি ব্যয় ট্র্যাক করা', ur: 'اخراجات ٹریکڈ' },
  property: { en: 'Property', ar: 'العقار', bn: 'সম্পত্তি', ur: 'پراپرٹی' },
  totalRevenue: { en: 'Total Revenue', ar: 'إجمالي الإيرادات', bn: 'মোট রাজস্ব', ur: 'کل آمدنی' },
  operatingExpenses: { en: 'Operating Expenses', ar: 'المصروفات التشغيلية', bn: 'পরিচালন ব্যয়', ur: 'آپریٹنگ اخراجات' },
  grossProfit: { en: 'Gross Profit', ar: 'الربح الإجمالي', bn: 'সমষ্টিগত মুনাফা', ur: 'کل منافع' },
  netIncome: { en: 'Net Income', ar: 'صافي الدخل', bn: 'নিট আয়', ur: 'خالص آمدنی' },
  salary: { en: 'Salary / Wages', ar: 'الرواتب / الأجور', bn: 'বেতন / মজুরি', ur: 'تنخواہ / اجرت' },
  yes: { en: 'Yes', ar: 'نعم', bn: 'হ্যাঁ', ur: 'ہاں' },
  no: { en: 'No', ar: 'لا', bn: 'না', ur: 'نہیں' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key
}

export function getNameByLang(obj: { name: string; nameAr?: string | null; nameBn?: string | null; nameUr?: string | null }, lang: Language): string {
  if (lang === 'ar' && obj.nameAr) return obj.nameAr
  if (lang === 'bn' && obj.nameBn) return obj.nameBn
  if (lang === 'ur' && obj.nameUr) return obj.nameUr
  return obj.name
}

export function getMonthName(month: number, lang: Language = 'en'): string {
  const months: Record<Language, string[]> = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    ur: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'],
  }
  return months[lang]?.[month - 1] || months.en[month - 1]
}

export function getWhatsAppLink(phone: string, name: string, amount: number, month: number, year: number, lang: Language = 'en'): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const monthName = getMonthName(month, lang)
  const amountStr = new Intl.NumberFormat('en-AE').format(amount) + ' AED'

  const messages: Record<Language, string> = {
    en: `Dear ${name}, this is a reminder that your rent of ${amountStr} for ${monthName} ${year} is overdue. Please arrange payment at your earliest convenience. — Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.`,
    ar: `عزيزي ${name}، تذكير بأن إيجارك بمبلغ ${amountStr} لشهر ${monthName} ${year} متأخر. يرجى ترتيب الدفع في أقرب وقت ممكن. — الريف الجنوبي للعقارات والصيانة العامة ذ.م.م`,
    bn: `প্রিয় ${name}, এটি স্মরণ করিয়ে দিচ্ছে যে আপনার ${monthName} ${year} এর জন্য ${amountStr} ভাড়া বকেয়া রয়েছে। দয়া করে শীঘ্রই পেমেন্টের ব্যবস্থা করুন। — আল রিফ আল জুনুবি রিয়েল এস্টেট অ্যান্ড জেনারেল মেইনটেন্যান্স এলএলসি`,
    ur: `محترم ${name}، یہ یاد دہانی ہے کہ آپ کا ${monthName} ${year} کے لیے ${amountStr} کرایہ باقاعدہ ہے۔ براہ کرم جلد ادائیگی کا بندوبست کریں۔ — الريف الجنوبی للعقارات والصيانة العامة ذ.م.م`,
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messages[lang] || messages.en)}`
}

export function getTenantScoreLabel(score: number, lang: Language): string {
  if (score >= 80) return t('scoreExcellent', lang)
  if (score >= 60) return t('scoreGood', lang)
  if (score >= 40) return t('scoreWarning', lang)
  return t('scorePoor', lang)
}

export function getTenantScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500 text-white'
  if (score >= 60) return 'bg-blue-500 text-white'
  if (score >= 40) return 'bg-amber-500 text-white'
  return 'bg-red-500 text-white'
}

export function calculateTenantScore(latePaymentCount: number, totalPayments: number): number {
  if (totalPayments === 0) return 100
  const onTimeRate = (totalPayments - latePaymentCount) / totalPayments
  return Math.round(onTimeRate * 100)
}

export function getPropertyTypeLabel(type: string, lang: Language): string {
  switch (type) {
    case 'apartment': return t('apartment', lang)
    case 'villa': return t('villa', lang)
    case 'office': return t('office', lang)
    case 'shop': return t('shop', lang)
    case 'studio': return t('studio', lang)
    case 'mixed_use': return t('mixedUse', lang)
    default: return type
  }
}

export function getMaintenanceCategoryLabel(category: string, lang: Language): string {
  switch (category) {
    case 'ac': return t('ac', lang)
    case 'plumbing': return t('plumbing', lang)
    case 'electrical': return t('electrical', lang)
    case 'lock_door': return t('lockDoor', lang)
    case 'painting': return t('painting', lang)
    case 'structural': return t('structural', lang)
    case 'other': return t('other', lang)
    default: return category
  }
}

export function getExpenseCategoryLabel(category: string, lang: Language): string {
  switch (category) {
    case 'manpower': return t('manpower', lang)
    case 'salary': return t('salary', lang)
    case 'municipality': return t('municipalityFees', lang)
    case 'maintenance': return t('maintenance2', lang)
    case 'utility': case 'utilities': return t('utilities', lang)
    case 'leasing': return t('leasingCommission', lang)
    case 'insurance': return t('insurance', lang)
    case 'security': return t('security', lang)
    case 'other': return t('other', lang)
    default: return category
  }
}

```

---

### src/lib/store.ts

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/lib/i18n'

export type PageType = 'dashboard' | 'properties' | 'tenants' | 'rent' | 'maintenance' | 'expenses' | 'reports' | 'contracts'

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

interface AppState {
  // Auth
  isAuthenticated: boolean
  authUser: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void

  // Navigation
  currentPage: PageType
  setCurrentPage: (page: PageType) => void

  // Language
  language: Language
  setLanguage: (lang: Language) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      isAuthenticated: false,
      authUser: null,
      login: (user) => set({ isAuthenticated: true, authUser: user }),
      logout: () => set({ isAuthenticated: false, authUser: null, currentPage: 'dashboard' }),

      // Navigation
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'al-reef-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authUser: state.authUser,
        language: state.language,
      }),
    }
  )
)

export function isOwnerOrAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

```

---

### src/lib/data-store.ts

```typescript
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
  properties: PropertyData[]
  tenants: TenantData[]
  payments: PaymentData[]
  expenses: ExpenseData[]
  maintenanceItems: MaintenanceData[]
  isSeeded: boolean

  // Auth
  authenticate: (email: string, password: string) => LocalUser | null

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
    name: 'Ahmed Al Junoobi',
    nameAr: 'أحمد الجنوبي',
    nameBn: 'আহমেদ আল জুনুবি',
    nameUr: 'احمد الجنوبی',
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

```

---

### src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' AED'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getPaymentStatusColor(status: 'paid' | 'overdue' | 'partial' | 'inactive' | 'due-soon'): string {
  switch (status) {
    case 'paid': return 'bg-emerald-500 text-white'
    case 'overdue': return 'bg-red-500 text-white'
    case 'partial': return 'bg-amber-500 text-white'
    case 'due-soon': return 'bg-yellow-400 text-gray-900'
    case 'inactive': return 'bg-gray-300 text-gray-600'
    default: return 'bg-gray-300 text-gray-600'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'evicted': return 'bg-red-100 text-red-800 border-red-200'
    case 'notice': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-amber-500 text-white'
    case 'low': return 'bg-emerald-500 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

export function getMaintenanceStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'utility': case 'utilities': return '⚡'
    case 'maintenance': case 'Maintenance': return '🔧'
    case 'insurance': return '🛡️'
    case 'salary': case 'manpower': return '👤'
    case 'other': return '📦'
    default: return '📦'
  }
}

// Helper for conditional class joining (lightweight)
export function cn2(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

```

---

### src/components/login.tsx

```typescript
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t, languageNames, rtlLanguages } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Moon, Languages, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const { login, language, setLanguage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRtl = rtlLanguages.includes(language)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use local data store instead of API
      const { useDataStore } = await import('@/lib/data-store')
      const user = useDataStore.getState().authenticate(email, password)
      if (user) {
        // Convert LocalUser to AuthUser format
        login({
          id: user.id,
          email: user.email,
          name: user.name,
          nameAr: user.nameAr,
          nameBn: user.nameBn,
          nameUr: user.nameUr,
          role: user.role,
          companyId: user.companyId,
        })
        // Auto-seed data if not seeded
        if (!useDataStore.getState().isSeeded) {
          useDataStore.getState().seedData()
        }
      } else {
        setError(t('loginError', language))
      }
    } catch {
      setError(t('loginError', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left side - Islamic geometric pattern background */}
      <div className="hidden lg:flex lg:w-1/2 islamic-pattern-full flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border border-gold/20" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-gold/10" />
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full border border-white/5" />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold/10">
            <Moon className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {t('loginTitle', language)}
          </h1>
          <p className="text-white/70 text-lg mb-8">
            {t('loginSubtitle', language)}
          </p>
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 max-w-sm">
            <Shield className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="text-white/80 text-sm">
              {language === 'en' && 'Secure access with role-based permissions. Staff cannot view financial data.'}
              {language === 'ar' && 'وصول آمن مع صلاحيات قائمة على الأدوار. لا يمكن للموظفين عرض البيانات المالية.'}
              {language === 'bn' && 'ভূমিকা-ভিত্তিক অনুমতি সহ নিরাপদ অ্যাক্সেস। কর্মীরা আর্থিক তথ্য দেখতে পারবেন না।'}
              {language === 'ur' && 'کردار پر مبنی اجازت کے ساتھ محفوظ رسائی۔ اسٹاف مالیاتی ڈیٹا نہیں دیکھ سکتے۔'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          {/* Language selector */}
          <div className="flex justify-end mb-8">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      language === lang
                        ? 'bg-deep-teal text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-deep-teal flex items-center justify-center">
              <Moon className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{t('loginTitle', language)}</h2>
              <p className="text-sm text-muted-foreground">{t('loginSubtitle', language)}</p>
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-2">{t('login', language)}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {language === 'en' && 'Enter your credentials to access the dashboard'}
              {language === 'ar' && 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم'}
              {language === 'bn' && 'ড্যাশবোর্ড অ্যাক্সেস করতে আপনার পরিচয়পত্র লিখুন'}
              {language === 'ur' && 'ڈیش بورڈ تک رسائی کے لیے اپنی اسناد درج کریں'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('email', language)}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@alreefjanoubi.ae"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">{t('password', language)}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-deep-teal hover:bg-deep-teal/90 text-white h-11"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('signInButton', language)
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'en' && 'Demo Credentials:'}
                {language === 'ar' && 'بيانات تجريبية:'}
                {language === 'bn' && 'ডেমো পরিচয়পত্র:'}
                {language === 'ur' && 'ڈیمو اسناد:'}
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setEmail('owner@alreef.ae'); setPassword('owner123') }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-emerald/5 hover:bg-emerald/10 text-xs transition-colors"
                >
                  <span className="font-semibold text-emerald">{t('ownerRole', language)}:</span>
                  <span className="text-muted-foreground ml-2">owner@alreef.ae / owner123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('staff@alreef.ae'); setPassword('staff123') }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs transition-colors"
                >
                  <span className="font-semibold text-blue-600">{t('staffRole', language)}:</span>
                  <span className="text-muted-foreground ml-2">staff@alreef.ae / staff123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

```

---

### src/components/sidebar.tsx

```typescript
'use client'

import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import type { PageType } from '@/lib/store'
import { t, languageNames, rtlLanguages } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { getNameByLang } from '@/lib/i18n'
import {
  LayoutDashboard,
  Building2,
  Users,
  Banknote,
  Wrench,
  Receipt,
  BarChart3,
  FileText,
  Moon,
  Languages,
  ChevronLeft,
  Menu,
  LogOut,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react'

const navItems: { page: PageType; icon: React.ElementType; key: string; ownerOnly?: boolean }[] = [
  { page: 'dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { page: 'properties', icon: Building2, key: 'properties' },
  { page: 'tenants', icon: Users, key: 'tenants' },
  { page: 'rent', icon: Banknote, key: 'rentCollection' },
  { page: 'maintenance', icon: Wrench, key: 'maintenance' },
  { page: 'expenses', icon: Receipt, key: 'expenses', ownerOnly: true },
  { page: 'reports', icon: BarChart3, key: 'reports', ownerOnly: true },
  { page: 'contracts', icon: FileText, key: 'contracts' },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, language, setLanguage, sidebarOpen, toggleSidebar, authUser, logout } = useAppStore()
  const isFinancialUser = authUser ? isOwnerOrAdmin(authUser.role) : false

  const visibleNavItems = navItems.filter(item => !item.ownerOnly || isFinancialUser)

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <ShieldCheck className="w-3 h-3" />
    if (role === 'admin') return <Shield className="w-3 h-3" />
    return <User className="w-3 h-3" />
  }

  const getRoleLabel = (role: string) => {
    if (role === 'owner') return t('ownerRole', language)
    if (role === 'admin') return t('adminRole', language)
    return t('staffRole', language)
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full islamic-pattern transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          !sidebarOpen && 'overflow-hidden lg:overflow-visible'
        )}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold/20 shrink-0">
            <Moon className="w-5 h-5 text-gold" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 animate-fade-in-up">
              <h1 className="text-white font-bold text-sm leading-tight truncate">
                {language === 'ar' ? 'الريف الجنوبي' : language === 'bn' ? 'আল রিফ আল জুনুবি' : language === 'ur' ? 'الریف الجنوبی' : 'Al Reef Al Junoobi'}
              </h1>
              <p className="text-white/50 text-xs truncate">
                {t('properties', language)}
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto text-white/60 hover:text-white shrink-0 hidden lg:block"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                setCurrentPage(item.page)
                if (window.innerWidth < 1024) toggleSidebar()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                currentPage === item.page
                  ? 'bg-gold/20 text-gold shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <span className="truncate">{t(item.key as any, language)}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
          {/* Language selector */}
          <div className="relative">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              onClick={() => {
                // Cycle through languages
                const langs: Language[] = ['en', 'ar', 'bn', 'ur']
                const next = langs[(langs.indexOf(language) + 1) % langs.length]
                setLanguage(next)
              }}
            >
              <Languages className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <span className="flex items-center gap-1.5">
                  {languageNames[language].native}
                  <span className="text-white/40 text-xs">({language.toUpperCase()})</span>
                </span>
              )}
            </button>
            {/* Language dots */}
            {sidebarOpen && (
              <div className="flex justify-center gap-1 mt-1 px-3">
                {(['en', 'ar', 'bn', 'ur'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium transition-all',
                      language === lang
                        ? 'bg-gold/30 text-gold'
                        : 'text-white/30 hover:text-white/60'
                    )}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User info + Logout */}
          {sidebarOpen && authUser && (
            <div className="px-3 py-2 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  {getRoleIcon(authUser.role)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/90 text-sm font-medium truncate">
                    {getNameByLang(authUser, language)}
                  </p>
                  <p className="text-white/40 text-xs flex items-center gap-1">
                    {getRoleLabel(authUser.role)}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
                  title={t('logout', language)}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 lg:hidden bg-deep-teal text-white p-2 rounded-lg shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

```

---

### src/components/dashboard.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DashboardData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, getPaymentStatusColor, cn2 } from '@/lib/utils'
import { t, getMonthName, getNameByLang, getWhatsAppLink, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Banknote,
  AlertTriangle,
  Users,
  Home,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MessageCircle,
  ChevronRight,
  Loader2,
  Lock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function Dashboard() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const canSeeFinancials = isOwnerOrAdmin(authUser?.role ?? '')

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    try {
      const dashboardData = useDataStore.getState().getDashboardData()
      if (dashboardData) {
        setData(dashboardData)
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg text-muted-foreground">
          {t('noData', lang)}
        </p>
        <Button
          onClick={() => {
            useDataStore.getState().seedData()
            fetchData()
          }}
          className="bg-emerald hover:bg-emerald/90"
        >
          {t('loadSampleData', lang)}
        </Button>
      </div>
    )
  }

  const s = data.stats
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return (
    <div className="space-y-6 stagger-children">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('dashboard', lang)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {getMonthName(currentMonth, lang)} {currentYear}
        </p>
      </div>

      {/* Overdue Alert Banner */}
      {s.overdueCount > 0 && (
        <div className="overdue-pulse bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg">
              {s.overdueCount} {t('overdueAlert', lang)}
            </p>
            {canSeeFinancials && (
              <p className="text-red-100 text-sm">
                {formatAED(s.overdueAmount)} {t('uncollected', lang)}
              </p>
            )}
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              useAppStore.getState().setCurrentPage('rent')
            }}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {t('viewDetails', lang)}
          </a>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Banknote className="w-5 h-5 text-emerald" />
              <Badge variant="secondary" className="text-xs">
                {t('monthly', lang)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('collectedRevenue', lang)}
            </p>
            {canSeeFinancials ? (
              <>
                <p className="text-xl font-bold text-emerald mt-1">
                  {formatAED(s.collectedRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald" />
                  <span className="text-xs text-muted-foreground">
                    {t('ofExpected', lang)} {formatAED(s.expectedRevenue)} {t('expected', lang)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t('financialDataProtected', lang)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn2('card-hover', s.overdueCount > 0 && 'border-l-4 border-l-red-500')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={cn2('w-5 h-5', s.overdueCount > 0 ? 'text-red-500' : 'text-gray-400')} />
              {s.overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 overdue-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('overdue', lang)}
            </p>
            <p className={cn2('text-xl font-bold mt-1', s.overdueCount > 0 ? 'text-red-600' : 'text-gray-600')}>
              {s.overdueCount}
            </p>
            {canSeeFinancials && s.overdueCount > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {formatAED(s.overdueAmount)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-gold" />
              <Badge variant="secondary" className="text-xs">
                {t('active', lang)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('activeTenants', lang)}
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {s.activeTenants}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {s.totalTenants} {t('total', lang)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Home className="w-5 h-5 text-deep-teal" />
              <Badge variant="secondary" className="text-xs">
                {s.occupancyRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('occupancyRate', lang)}
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {s.occupiedUnits}/{s.totalUnits}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-deep-teal h-1.5 rounded-full transition-all"
                style={{ width: `${s.occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Board */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {t('paymentStatusBoard', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.activeTenantsList.map((tenant: any) => {
              const payments = tenant.payments || []
              const monthPayments = payments.filter((p: any) => p.month === currentMonth && p.year === currentYear)
              const totalPaid = monthPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

              let status: 'paid' | 'overdue' | 'partial' | 'inactive' | 'due-soon'
              if (tenant.status !== 'active') {
                status = 'inactive'
              } else if (totalPaid >= tenant.rentAmount) {
                status = 'paid'
              } else if (totalPaid > 0) {
                status = 'partial'
              } else {
                status = 'overdue'
              }

              return (
                <div
                  key={tenant.id}
                  className={cn2(
                    'rounded-lg p-3 text-center card-hover cursor-pointer',
                    getPaymentStatusColor(status)
                  )}
                >
                  <p className="font-semibold text-sm truncate">
                    {getNameByLang(tenant, lang)}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {tenant.unitNumber || '—'}
                  </p>
                  <p className="text-xs font-bold mt-1">
                    {status === 'paid' && t('paid', lang)}
                    {status === 'overdue' && t('overdue', lang)}
                    {status === 'partial' && t('partial', lang)}
                    {status === 'inactive' && t('inactive', lang)}
                    {status === 'due-soon' && t('dueSoon', lang)}
                  </p>
                  {status === 'overdue' && (
                    <a
                      href={getWhatsAppLink(tenant.phone, tenant.name, tenant.rentAmount, currentMonth, currentYear, lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs bg-white/20 rounded px-1.5 py-0.5 hover:bg-white/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3 h-3" />
                      {t('remind', lang)}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {t('revenueTrend', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canSeeFinancials ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatAED(value)}
                      contentStyle={{
                        backgroundColor: '#FFF8E7',
                        border: '1px solid #e5e0d5',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expected" name={t('expected', lang)} fill="#0A5C4E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name={t('collected', lang)} fill="#C5A028" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2">
                <Lock className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center">
                  {t('financialDataProtected', lang)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {t('recentPayments', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {data.recentPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-emerald" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {payment.tenant ? getNameByLang(payment.tenant, lang) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method || '—'} • {payment.reference || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {canSeeFinancials ? (
                      <p className="text-sm font-semibold text-emerald">
                        {formatAED(payment.amount)}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-emerald">
                        ✓
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getMonthName(payment.month, lang)} {payment.year}
                    </p>
                  </div>
                </div>
              ))}
              {data.recentPayments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noRecentPayments', lang)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

```

---

### src/components/properties.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, cn2 } from '@/lib/utils'
import { t, getPropertyTypeLabel, getNameByLang, type Language } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Pencil, Trash2, Users, Loader2, Archive, ArchiveRestore } from 'lucide-react'

export default function Properties() {
  const { language, authUser } = useAppStore()
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyData | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    nameBn: '',
    nameUr: '',
    type: 'apartment',
    address: '',
    totalUnits: 1,
    floors: 1,
  })

  const canSeeRevenue = isOwnerOrAdmin(authUser?.role || '')

  const fetchProperties = useCallback(() => {
    try {
      const data = useDataStore.getState().getPropertiesWithTenants(showArchived)
      setProperties(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [showArchived])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', nameAr: '', nameBn: '', nameUr: '', type: 'apartment', address: '', totalUnits: 1, floors: 1 })
    setDialogOpen(true)
  }

  const openEdit = (p: PropertyData) => {
    setEditing(p)
    setForm({
      name: p.name,
      nameAr: p.nameAr || '',
      nameBn: p.nameBn || '',
      nameUr: p.nameUr || '',
      type: p.type,
      address: p.address || '',
      totalUnits: p.totalUnits,
      floors: p.floors || 1,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const body = { ...form, totalUnits: Number(form.totalUnits), floors: Number(form.floors) }
    if (editing) {
      useDataStore.getState().updateProperty(editing.id, body)
    } else {
      useDataStore.getState().addProperty(body)
    }
    setDialogOpen(false)
    fetchProperties()
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteProperty', language))) return
    useDataStore.getState().deleteProperty(id)
    fetchProperties()
  }

  const handleArchive = (id: string, archived: boolean) => {
    useDataStore.getState().archiveProperty(id, archived)
    fetchProperties()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('properties', language)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties.length} {t('propertiesManaged', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}
          >
            <Archive className="w-4 h-4 mr-1" />
            {t('archiveProperty', language)}
          </Button>
          <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t('addProperty', language)}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {properties.map((p) => {
          const activeTenants = (p.tenants || []).filter(t => t.status === 'active').length
          const occupancy = p.totalUnits > 0 ? Math.round((activeTenants / p.totalUnits) * 100) : 0
          const totalRent = (p.tenants || []).filter(t => t.status === 'active').reduce((s, t) => s + t.rentAmount, 0)

          return (
            <Card key={p.id} className={cn2('card-hover', p.archived && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {getNameByLang(p, language)}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {getPropertyTypeLabel(p.type, language)}
                        </Badge>
                        {p.archived && (
                          <Badge variant="outline" className="text-xs border-gray-400 text-gray-500">
                            {t('sellProperty', language)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleArchive(p.id, !p.archived)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title={p.archived ? t('archiveProperty', language) : t('archiveProperty', language)}>
                      {p.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {p.address && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">{p.address}</p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('units', language)}</p>
                    <p className="font-bold text-sm">{p.totalUnits}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('tenantsCount', language)}</p>
                    <p className="font-bold text-sm">{activeTenants}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{t('occupancy', language)}</p>
                    <p className="font-bold text-sm">{occupancy}%</p>
                  </div>
                </div>

                {canSeeRevenue && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('monthlyRevenue', language)}</span>
                      <span className="font-semibold text-sm text-emerald">{formatAED(totalRent)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-emerald h-1.5 rounded-full transition-all"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editProperty', language) : t('addProperty', language)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('propertyName', language)}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Building A" />
            </div>
            <div>
              <Label>{t('nameArabic', language)}</Label>
              <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="المبنى أ" dir="rtl" />
            </div>
            <div>
              <Label>{t('nameBengali', language)}</Label>
              <Input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} placeholder="বিল্ডিং এ" />
            </div>
            <div>
              <Label>{t('nameUrdu', language)}</Label>
              <Input value={form.nameUr} onChange={e => setForm({ ...form, nameUr: e.target.value })} placeholder="بلڈنگ اے" dir="rtl" />
            </div>
            <div>
              <Label>{t('propertyType', language)}</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{t('apartment', language)}</SelectItem>
                  <SelectItem value="villa">{t('villa', language)}</SelectItem>
                  <SelectItem value="office">{t('office', language)}</SelectItem>
                  <SelectItem value="shop">{t('shop', language)}</SelectItem>
                  <SelectItem value="studio">{t('studio', language)}</SelectItem>
                  <SelectItem value="mixed_use">{t('mixedUse', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('address', language)}</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('totalUnitsCount', language)}</Label>
                <Input type="number" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>{t('floors', language)}</Label>
                <Input type="number" value={form.floors} onChange={e => setForm({ ...form, floors: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.name}>
              {t('save', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

---

### src/components/tenants.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { t, getNameByLang, getWhatsAppLink, getTenantScoreLabel, getTenantScoreColor, type Language } from '@/lib/i18n'
import { cn2, formatAED, formatDate, getStatusColor } from '@/lib/utils'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users, Plus, Pencil, Trash2, Search, MessageCircle,
  ChevronDown, ChevronUp, Loader2, Phone, Mail,
  MapPin, CreditCard, Shield, AlertTriangle, Clock,
  Building, Ruler, FileText, Star, ExternalLink
} from 'lucide-react'

interface TenantFormState {
  name: string
  nameAr: string
  nameBn: string
  nameUr: string
  phone: string
  whatsapp: string
  email: string
  emiratesId: string
  nationality: string
  employer: string
  emergencyContact: string
  propertyId: string
  unitNumber: string
  unitType: string
  floor: string
  sizeSqft: string
  rentAmount: string
  municipalityFee: string
  securityDeposit: string
  paymentMethod: string
  leaseStart: string
  leaseEnd: string
  contractDuration: string
  status: string
  notes: string
}

const emptyForm: TenantFormState = {
  name: '', nameAr: '', nameBn: '', nameUr: '',
  phone: '', whatsapp: '', email: '', emiratesId: '',
  nationality: '', employer: '', emergencyContact: '',
  propertyId: '', unitNumber: '', unitType: '', floor: '',
  sizeSqft: '', rentAmount: '0', municipalityFee: '',
  securityDeposit: '', paymentMethod: '', leaseStart: '',
  leaseEnd: '', contractDuration: '', status: 'active', notes: '',
}

const unitTypes = ['studio', '1bedroom', '2bedroom', '3bedroom', 'shop', 'office']
const paymentMethods = ['cash', 'bank_transfer', 'cheque']
const statusOptions = ['active', 'inactive', 'evicted', 'notice']

function getUnitTypeLabel(type: string, lang: Language): string {
  switch (type) {
    case 'studio': return t('studio', lang)
    case '1bedroom': return t('oneBedroom', lang)
    case '2bedroom': return t('twoBedroom', lang)
    case '3bedroom': return t('threeBedroom', lang)
    case 'shop': return t('shop', lang)
    case 'office': return t('office', lang)
    default: return type
  }
}

function getPaymentMethodLabel(method: string, lang: Language): string {
  switch (method) {
    case 'cash': return t('cash', lang)
    case 'bank_transfer': return t('bankTransfer', lang)
    case 'cheque': return t('cheque', lang)
    default: return method
  }
}

function getStatusLabel(status: string, lang: Language): string {
  switch (status) {
    case 'active': return t('active', lang)
    case 'inactive': return t('inactive2', lang)
    case 'evicted': return t('evicted', lang)
    case 'notice': return t('notice', lang)
    default: return status
  }
}

export default function Tenants() {
  const { language, authUser } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TenantData | null>(null)
  const [form, setForm] = useState<TenantFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Profile dialog
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTenant, setProfileTenant] = useState<TenantData | null>(null)

  const isPrivileged = authUser ? isOwnerOrAdmin(authUser.role) : true

  const fetchData = useCallback(() => {
    try {
      const store = useDataStore.getState()
      setTenants(store.getTenantsWithRelations())
      setProperties(store.getPropertiesWithTenants())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, propertyId: properties[0]?.id || '' })
    setDialogOpen(true)
  }

  const openEdit = (tenant: TenantData) => {
    setEditing(tenant)
    setForm({
      name: tenant.name,
      nameAr: tenant.nameAr || '',
      nameBn: tenant.nameBn || '',
      nameUr: tenant.nameUr || '',
      phone: tenant.phone,
      whatsapp: tenant.whatsapp || '',
      email: tenant.email || '',
      emiratesId: tenant.emiratesId || '',
      nationality: tenant.nationality || '',
      employer: tenant.employer || '',
      emergencyContact: tenant.emergencyContact || '',
      propertyId: tenant.propertyId,
      unitNumber: tenant.unitNumber || '',
      unitType: tenant.unitType || '',
      floor: tenant.floor != null ? String(tenant.floor) : '',
      sizeSqft: tenant.sizeSqft != null ? String(tenant.sizeSqft) : '',
      rentAmount: String(tenant.rentAmount),
      municipalityFee: tenant.municipalityFee != null ? String(tenant.municipalityFee) : '',
      securityDeposit: tenant.securityDeposit != null ? String(tenant.securityDeposit) : '',
      paymentMethod: tenant.paymentMethod || '',
      leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart).toISOString().split('T')[0] : '',
      leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd).toISOString().split('T')[0] : '',
      contractDuration: tenant.contractDuration != null ? String(tenant.contractDuration) : '',
      status: tenant.status,
      notes: tenant.notes || '',
    })
    setDialogOpen(true)
  }

  const openProfile = (tenant: TenantData) => {
    setProfileTenant(tenant)
    setProfileOpen(true)
  }

  const handleSave = () => {
    setSaving(true)
    try {
      const store = useDataStore.getState()
      const rentAmount = Number(form.rentAmount) || 0
      const muniFee = form.municipalityFee ? Number(form.municipalityFee) : Math.round(rentAmount * 0.05)
      const body: any = {
        ...form,
        rentAmount,
        municipalityFee: muniFee,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null,
        floor: form.floor ? Number(form.floor) : null,
        sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : null,
        contractDuration: form.contractDuration ? Number(form.contractDuration) : null,
      }
      if (editing) {
        store.updateTenant(editing.id, body)
      } else {
        store.addTenant(body)
      }
      setDialogOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteTenant', language))) return
    useDataStore.getState().deleteTenant(id)
    fetchData()
  }

  const updateForm = (field: keyof TenantFormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-calculate municipality fee when rent changes
      if (field === 'rentAmount' && !prev.municipalityFee) {
        next.municipalityFee = String(Math.round((Number(value) || 0) * 0.05))
      }
      return next
    })
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const activeCount = tenants.filter(t => t.status === 'active').length

  const filtered = tenants.filter(t => {
    const name = getNameByLang(t, language).toLowerCase()
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      (t.nameAr && t.nameAr.includes(search)) ||
      (t.nameBn && t.nameBn.includes(search)) ||
      (t.nameUr && t.nameUr.includes(search)) ||
      t.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      (t.emiratesId && t.emiratesId.includes(search))
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('tenants', language)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} {t('activeTenants', language).toLowerCase()}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTenant', language)}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchTenants', language)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus', language)}</SelectItem>
            <SelectItem value="active">{t('active', language)}</SelectItem>
            <SelectItem value="inactive">{t('inactive2', language)}</SelectItem>
            <SelectItem value="evicted">{t('evicted', language)}</SelectItem>
            <SelectItem value="notice">{t('notice', language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tenantName', language)}</TableHead>
                  <TableHead>{t('propertyUnit', language)}</TableHead>
                  <TableHead>{t('rent', language)}</TableHead>
                  <TableHead>{t('tenantScore', language)}</TableHead>
                  <TableHead>{t('status', language)}</TableHead>
                  <TableHead>{t('lastPayment', language)}</TableHead>
                  <TableHead className="text-right">{t('actions', language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => {
                  const payments = tenant.payments || []
                  const lastPayment = payments.length > 0 ? payments[0] : null
                  const currentMonthPaid = payments.some(p => p.month === currentMonth && p.year === currentYear)
                  const isExpanded = expandedTenant === tenant.id
                  const displayName = getNameByLang(tenant, language)

                  return (
                    <>
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => openProfile(tenant)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={cn2(
                                'text-xs font-semibold',
                                tenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                tenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-700' :
                                tenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>
                                {displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{displayName}</p>
                              <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{getNameByLang(tenant.property || { name: '—' }, language)}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.unitNumber || '—'}
                            {tenant.unitType ? ` · ${getUnitTypeLabel(tenant.unitType, language)}` : ''}
                          </p>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{formatAED(tenant.rentAmount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn2('text-xs font-bold px-2 py-0.5', getTenantScoreColor(tenant.tenantScore))}>
                              {tenant.tenantScore}
                            </Badge>
                            {tenant.latePaymentCount > 0 && (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-600 px-1.5 py-0.5">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />
                                {tenant.latePaymentCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn2('text-xs', getStatusColor(tenant.status))}>
                            {getStatusLabel(tenant.status, language)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lastPayment ? (
                            <div>
                              <p className="text-sm">{formatAED(lastPayment.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {lastPayment.isLate && (
                                  <span className="text-red-500 mr-1">⚠</span>
                                )}
                                {formatDate(lastPayment.date)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t('noPayments', language)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {tenant.status === 'active' && !currentMonthPaid && (
                              <a
                                href={getWhatsAppLink(tenant.phone, displayName, tenant.rentAmount, currentMonth, currentYear, language)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-green-50 text-green-600"
                                title={t('sendWhatsAppReminder', language)}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(tenant) }}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {isPrivileged && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(tenant.id) }}
                                className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedTenant(isExpanded ? null : tenant.id) }}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded payment history */}
                      {isExpanded && (
                        <TableRow key={`${tenant.id}-expanded`}>
                          <TableCell colSpan={7} className="bg-muted/20 p-4">
                            <h4 className="font-semibold text-sm mb-3">{t('paymentHistory', language)}</h4>
                            {payments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('noPayments', language)}</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {payments.slice(0, 24).map(p => (
                                  <div key={p.id} className={cn2(
                                    'rounded-lg p-2 border text-sm',
                                    p.isLate ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                  )}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{formatAED(p.amount)}</span>
                                      {p.isLate && (
                                        <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 px-1 py-0">
                                          {t('late', language)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                                      {p.method && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                          {getPaymentMethodLabel(p.method, language)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('noTenantsFound', language)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== TENANT PROFILE DIALOG ===================== */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {profileTenant && (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={cn2(
                      'text-sm font-semibold',
                      profileTenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      profileTenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-700' :
                      profileTenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {getNameByLang(profileTenant, language).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{t('tenantProfile', language)}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {getNameByLang(profileTenant, language)}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {profileTenant && (
            <ScrollArea className="max-h-[70vh] pr-1">
              <div className="space-y-5 pb-4">
                {/* Score & Late Payments - Prominent */}
                <div className="flex gap-3 flex-wrap">
                  <div className={cn2(
                    'flex items-center gap-2 rounded-lg px-4 py-2',
                    profileTenant.tenantScore >= 80 ? 'bg-emerald-50 border border-emerald-200' :
                    profileTenant.tenantScore >= 60 ? 'bg-blue-50 border border-blue-200' :
                    profileTenant.tenantScore >= 40 ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  )}>
                    <Star className={cn2(
                      'w-5 h-5',
                      profileTenant.tenantScore >= 80 ? 'text-emerald-600' :
                      profileTenant.tenantScore >= 60 ? 'text-blue-600' :
                      profileTenant.tenantScore >= 40 ? 'text-amber-600' :
                      'text-red-600'
                    )} />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('tenantScore', language)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{profileTenant.tenantScore}</span>
                        <Badge className={cn2('text-xs', getTenantScoreColor(profileTenant.tenantScore))}>
                          {getTenantScoreLabel(profileTenant.tenantScore, language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={cn2(
                    'flex items-center gap-2 rounded-lg px-4 py-2',
                    profileTenant.latePaymentCount > 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  )}>
                    <Clock className={cn2(
                      'w-5 h-5',
                      profileTenant.latePaymentCount > 0 ? 'text-red-600' : 'text-emerald-600'
                    )} />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('latePayments', language)}</p>
                      <span className={cn2(
                        'text-xl font-bold',
                        profileTenant.latePaymentCount > 0 ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {profileTenant.latePaymentCount}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    {t('personalInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('tenantName', language)} value={getNameByLang(profileTenant, language)} />
                    {profileTenant.emiratesId && (
                      <ProfileField label={t('emiratesId', language)} value={profileTenant.emiratesId} icon={<Shield className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.nationality && (
                      <ProfileField label={t('nationality', language)} value={profileTenant.nationality} />
                    )}
                    {profileTenant.employer && (
                      <ProfileField label={t('employer2', language)} value={profileTenant.employer} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    {t('contactInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('phone', language)} value={profileTenant.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                    {profileTenant.whatsapp && (
                      <ProfileField
                        label={t('whatsapp', language)}
                        value={profileTenant.whatsapp}
                        icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                      />
                    )}
                    {profileTenant.email && (
                      <ProfileField label={t('email', language)} value={profileTenant.email} icon={<Mail className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.emergencyContact && (
                      <ProfileField label={t('emergencyContact', language)} value={profileTenant.emergencyContact} icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Lease & Property Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    {t('leaseInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField
                      label={t('building', language)}
                      value={profileTenant.property ? getNameByLang(profileTenant.property, language) : '—'}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                    />
                    <ProfileField label={t('unitNumber', language)} value={profileTenant.unitNumber || '—'} />
                    {profileTenant.unitType && (
                      <ProfileField label={t('unitType', language)} value={getUnitTypeLabel(profileTenant.unitType, language)} />
                    )}
                    {profileTenant.floor != null && (
                      <ProfileField label={t('floor2', language)} value={String(profileTenant.floor)} />
                    )}
                    {profileTenant.sizeSqft != null && (
                      <ProfileField label={t('sizeSqft', language)} value={`${profileTenant.sizeSqft} sqft`} icon={<Ruler className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.leaseStart && (
                      <ProfileField label={t('leaseStart', language)} value={formatDate(profileTenant.leaseStart)} icon={<Clock className="w-3.5 h-3.5" />} />
                    )}
                    {profileTenant.leaseEnd && (
                      <ProfileField label={t('leaseEnd', language)} value={formatDate(profileTenant.leaseEnd)} />
                    )}
                    {profileTenant.contractDuration != null && (
                      <ProfileField label={t('contractDuration', language)} value={`${profileTenant.contractDuration} ${t('months', language)}`} icon={<FileText className="w-3.5 h-3.5" />} />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Financial Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    {t('financialInfo', language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProfileField label={t('monthlyRent', language)} value={formatAED(profileTenant.rentAmount)} />
                    {profileTenant.municipalityFee != null && (
                      <ProfileField label={t('municipalityFee', language)} value={formatAED(profileTenant.municipalityFee)} />
                    )}
                    {isPrivileged && profileTenant.securityDeposit != null && (
                      <ProfileField label={t('securityDeposit', language)} value={formatAED(profileTenant.securityDeposit)} />
                    )}
                    {profileTenant.paymentMethod && (
                      <ProfileField label={t('paymentMethod', language)} value={getPaymentMethodLabel(profileTenant.paymentMethod, language)} />
                    )}
                  </div>
                </div>

                {/* Notes */}
                {profileTenant.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">{t('notes', language)}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profileTenant.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Payment History */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">{t('paymentHistory', language)}</h3>
                  {(profileTenant.payments || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('noPayments', language)}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {(profileTenant.payments || []).map(p => (
                        <div key={p.id} className={cn2(
                          'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                          p.isLate ? 'bg-red-50' : 'bg-muted/50'
                        )}>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{formatAED(p.amount)}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                            {p.method && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {getPaymentMethodLabel(p.method, language)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.isLate && (
                              <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 px-1.5 py-0">
                                {t('late', language)} {p.daysLate > 0 ? `(${p.daysLate}d)` : ''}
                              </Badge>
                            )}
                            {!p.isLate && (
                              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 px-1.5 py-0">
                                {t('onTime', language)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WhatsApp Reminder Button */}
                {profileTenant.status === 'active' && (
                  <div className="pt-2">
                    <a
                      href={getWhatsAppLink(
                        profileTenant.whatsapp || profileTenant.phone,
                        getNameByLang(profileTenant, language),
                        profileTenant.rentAmount,
                        currentMonth,
                        currentYear,
                        language
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t('sendWhatsAppReminder', language)}
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== ADD/EDIT TENANT DIALOG ===================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editTenant', language) : t('addTenant', language)}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-6 pb-4">
              {/* Name Fields - 4 Languages */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  {t('tenantName', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('nameEnglish', language)} *</Label>
                    <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>{t('nameArabic', language)}</Label>
                    <Input value={form.nameAr} onChange={e => updateForm('nameAr', e.target.value)} dir="rtl" placeholder="جون دو" />
                  </div>
                  <div>
                    <Label>{t('nameBengali', language)}</Label>
                    <Input value={form.nameBn} onChange={e => updateForm('nameBn', e.target.value)} placeholder="জন ডো" />
                  </div>
                  <div>
                    <Label>{t('nameUrdu', language)}</Label>
                    <Input value={form.nameUr} onChange={e => updateForm('nameUr', e.target.value)} dir="rtl" placeholder="جون ڈو" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  {t('contactInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('phone', language)} *</Label>
                    <Input value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+971501234567" />
                  </div>
                  <div>
                    <Label>{t('whatsapp', language)}</Label>
                    <Input value={form.whatsapp} onChange={e => updateForm('whatsapp', e.target.value)} placeholder="+971501234567" />
                  </div>
                  <div>
                    <Label>{t('email', language)}</Label>
                    <Input value={form.email} onChange={e => updateForm('email', e.target.value)} type="email" placeholder="tenant@email.com" />
                  </div>
                  <div>
                    <Label>{t('emergencyContact', language)}</Label>
                    <Input value={form.emergencyContact} onChange={e => updateForm('emergencyContact', e.target.value)} placeholder="+971501234567" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  {t('personalInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('emiratesId', language)}</Label>
                    <Input value={form.emiratesId} onChange={e => updateForm('emiratesId', e.target.value)} placeholder="784-1990-1234567-1" />
                  </div>
                  <div>
                    <Label>{t('nationality', language)}</Label>
                    <Input value={form.nationality} onChange={e => updateForm('nationality', e.target.value)} placeholder="UAE, Indian, Pakistani..." />
                  </div>
                  <div>
                    <Label>{t('employer2', language)}</Label>
                    <Input value={form.employer} onChange={e => updateForm('employer', e.target.value)} placeholder="Company name" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property & Unit */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  {t('leaseInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('propertyName', language)} *</Label>
                    <Select value={form.propertyId} onValueChange={v => updateForm('propertyId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectProperty', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.filter(p => !p.archived).map(p => (
                          <SelectItem key={p.id} value={p.id}>{getNameByLang(p, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('unitNumber', language)}</Label>
                    <Input value={form.unitNumber} onChange={e => updateForm('unitNumber', e.target.value)} placeholder="Apt 201" />
                  </div>
                  <div>
                    <Label>{t('unitType', language)}</Label>
                    <Select value={form.unitType} onValueChange={v => updateForm('unitType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('unitType', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map(ut => (
                          <SelectItem key={ut} value={ut}>{getUnitTypeLabel(ut, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('floor2', language)}</Label>
                    <Input type="number" value={form.floor} onChange={e => updateForm('floor', e.target.value)} placeholder="3" />
                  </div>
                  <div>
                    <Label>{t('sizeSqft', language)}</Label>
                    <Input type="number" value={form.sizeSqft} onChange={e => updateForm('sizeSqft', e.target.value)} placeholder="850" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {t('financialInfo', language)}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('monthlyRent', language)} *</Label>
                    <Input
                      type="number"
                      value={form.rentAmount}
                      onChange={e => updateForm('rentAmount', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t('municipalityFee', language)}</Label>
                    <Input
                      type="number"
                      value={form.municipalityFee}
                      onChange={e => updateForm('municipalityFee', e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{t('autoCalc', language)}</p>
                  </div>
                  {isPrivileged && (
                    <div>
                      <Label>{t('securityDeposit', language)}</Label>
                      <Input
                        type="number"
                        value={form.securityDeposit}
                        onChange={e => updateForm('securityDeposit', e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <Label>{t('paymentMethod', language)}</Label>
                    <Select value={form.paymentMethod} onValueChange={v => updateForm('paymentMethod', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('paymentMethod', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(pm => (
                          <SelectItem key={pm} value={pm}>{getPaymentMethodLabel(pm, language)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('leaseStart', language)}</Label>
                  <Input type="date" value={form.leaseStart} onChange={e => updateForm('leaseStart', e.target.value)} />
                </div>
                <div>
                  <Label>{t('leaseEnd', language)}</Label>
                  <Input type="date" value={form.leaseEnd} onChange={e => updateForm('leaseEnd', e.target.value)} />
                </div>
                <div>
                  <Label>{t('contractDuration', language)}</Label>
                  <Input type="number" value={form.contractDuration} onChange={e => updateForm('contractDuration', e.target.value)} placeholder="12" />
                </div>
                <div>
                  <Label>{t('status', language)}</Label>
                  <Select value={form.status} onValueChange={v => updateForm('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{getStatusLabel(s, language)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>{t('notes', language)}</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  placeholder={t('notes', language)}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!form.name || !form.phone || !form.propertyId || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Small helper component for profile fields ---------- */
function ProfileField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

```

---

### src/components/rent-collection.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, getPaymentStatusColor, cn2 } from '@/lib/utils'
import { t, getMonthName, getNameByLang, getWhatsAppLink, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Banknote, MessageCircle, Check, AlertTriangle, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RentCollection() {
  const { language, authUser } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payingTenant, setPayingTenant] = useState<TenantData | null>(null)
  const [payForm, setPayForm] = useState({ amount: 0, method: 'cash', reference: '', notes: '' })

  const canSeeRevenue = isOwnerOrAdmin(authUser?.role || '')

  const fetchData = useCallback(() => {
    try {
      const tenants = useDataStore.getState().getTenantsWithRelations()
      setTenants(tenants)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const activeTenants = tenants.filter(t => t.status === 'active')

  const getTenantPaymentStatus = (tenant: TenantData): 'paid' | 'partial' | 'overdue' | 'due-soon' => {
    const payments = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid >= tenant.rentAmount) return 'paid'
    if (totalPaid > 0) return 'partial'
    const now = new Date()
    if (selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() && now.getDate() <= 5) return 'due-soon'
    if (selectedMonth < now.getMonth() + 1 || selectedYear < now.getFullYear()) return 'overdue'
    return 'overdue'
  }

  const filteredTenants = activeTenants.filter(t => {
    const status = getTenantPaymentStatus(t)
    if (filter === 'all') return true
    if (filter === 'paid') return status === 'paid'
    if (filter === 'unpaid') return status === 'overdue' || status === 'due-soon' || status === 'partial'
    if (filter === 'overdue') return status === 'overdue'
    return true
  })

  const stats = {
    total: activeTenants.length,
    paid: activeTenants.filter(t => getTenantPaymentStatus(t) === 'paid').length,
    partial: activeTenants.filter(t => getTenantPaymentStatus(t) === 'partial').length,
    overdue: activeTenants.filter(t => getTenantPaymentStatus(t) === 'overdue').length,
    expectedRevenue: activeTenants.reduce((s, t) => s + t.rentAmount, 0),
    collectedRevenue: activeTenants.reduce((s, t) => {
      const paid = (t.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
      return s + paid
    }, 0),
  }

  const openPayDialog = (tenant: TenantData) => {
    setPayingTenant(tenant)
    const paid = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
    setPayForm({ amount: tenant.rentAmount - paid, method: 'cash', reference: '', notes: '' })
    setPayDialogOpen(true)
  }

  const handlePay = () => {
    if (!payingTenant) return
    useDataStore.getState().addPayment({
      tenantId: payingTenant.id,
      amount: payForm.amount,
      date: new Date().toISOString(),
      month: selectedMonth,
      year: selectedYear,
      method: payForm.method,
      reference: payForm.reference || null,
      receiptNumber: null,
      notes: payForm.notes || null,
      isLate: false,
      daysLate: 0,
    })
    setPayDialogOpen(false)
    fetchData()
  }

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const nextMonth = () => {
    const now = new Date()
    if (selectedMonth >= now.getMonth() + 1 && selectedYear >= now.getFullYear()) return
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const sendAllReminders = () => {
    const unpaid = activeTenants.filter(t => {
      const status = getTenantPaymentStatus(t)
      return status === 'overdue' || status === 'partial'
    })
    for (const tenant of unpaid) {
      const phone = tenant.whatsapp || tenant.phone
      window.open(getWhatsAppLink(phone, getNameByLang(tenant, language), tenant.rentAmount, selectedMonth, selectedYear, language), '_blank')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('rentCollection', language)}</h1>
        </div>
        <Button onClick={sendAllReminders} variant="outline" className="border-emerald text-emerald hover:bg-emerald/10">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('remindAllUnpaid', language)}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {getMonthName(selectedMonth, language)} {selectedYear}
          </h2>
          {canSeeRevenue && (
            <p className="text-sm text-muted-foreground">
              {stats.collectedRevenue.toLocaleString()} / {stats.expectedRevenue.toLocaleString()} AED {t('collected', language)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={selectedMonth >= new Date().getMonth() + 1 && selectedYear >= new Date().getFullYear()}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('activeTenants', language)}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('paid', language)}</p>
            <p className="text-2xl font-bold text-emerald">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-amber-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('partial', language)}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-red-500">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('overdue', language)}</p>
            <p className="text-2xl font-bold text-red-600 overdue-pulse">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection progress */}
      {canSeeRevenue && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('collectionProgress', language)}</span>
              <span className="text-sm font-bold text-emerald">
                {stats.expectedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.expectedRevenue) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-emerald h-3 rounded-full transition-all"
                style={{ width: `${stats.expectedRevenue > 0 ? (stats.collectedRevenue / stats.expectedRevenue) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'paid', 'unpaid', 'overdue'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {f === 'all' && t('all', language)}
            {f === 'paid' && t('paid', language)}
            {f === 'unpaid' && t('unpaid', language)}
            {f === 'overdue' && t('overdue', language)}
          </Button>
        ))}
      </div>

      {/* Tenant Payment Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filteredTenants.map(tenant => {
          const status = getTenantPaymentStatus(tenant)
          const paid = (tenant.payments || []).filter(p => p.month === selectedMonth && p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0)
          const remaining = tenant.rentAmount - paid

          return (
            <Card key={tenant.id} className={cn2('card-hover', status === 'overdue' && 'ring-1 ring-red-300')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {getNameByLang(tenant, language)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tenant.property ? getNameByLang(tenant.property, language) : ''} • {tenant.unitNumber || '—'}
                    </p>
                  </div>
                  <Badge className={cn2('text-xs', getPaymentStatusColor(status))}>
                    {status === 'paid' && t('paid', language)}
                    {status === 'partial' && t('partial', language)}
                    {status === 'overdue' && t('overdue', language)}
                    {status === 'due-soon' && t('dueSoon', language)}
                  </Badge>
                </div>

                {canSeeRevenue && (
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('rent', language)}</p>
                      <p className="font-bold text-sm">{formatAED(tenant.rentAmount)}</p>
                    </div>
                    {status !== 'paid' && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('remaining', language)}</p>
                        <p className="font-bold text-sm text-red-600">{formatAED(remaining)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {status !== 'paid' && (
                    <Button
                      size="sm"
                      onClick={() => openPayDialog(tenant)}
                      className="flex-1 bg-emerald hover:bg-emerald/90 text-white h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t('markPaid', language)}
                    </Button>
                  )}
                  {status !== 'paid' && (
                    <a
                      href={getWhatsAppLink(tenant.whatsapp || tenant.phone, getNameByLang(tenant, language), remaining, selectedMonth, selectedYear, language)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs border border-green-300 text-green-700 hover:bg-green-50"
                      title={t('sendWhatsAppReminder', language)}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('noTenantsMatchFilter', language)}
        </div>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('recordPayment', language)} — {payingTenant && getNameByLang(payingTenant, language)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('amount', language)}</Label>
              <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('paymentMethod', language)}</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('cash', language)}</SelectItem>
                  <SelectItem value="transfer">{t('bankTransfer', language)}</SelectItem>
                  <SelectItem value="cheque">{t('cheque', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('reference', language)}</Label>
              <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
            </div>
            <div>
              <Label>{t('notes', language)}</Label>
              <Input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button onClick={handlePay} className="bg-emerald hover:bg-emerald/90 text-white" disabled={payForm.amount <= 0}>
              <Check className="w-4 h-4 mr-2" />
              {t('confirmPayment', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

---

### src/components/maintenance.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { MaintenanceData, PropertyData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, getPriorityColor, getMaintenanceStatusColor } from '@/lib/utils'
import { t, getNameByLang, getMaintenanceCategoryLabel, type Language } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Wrench, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react'

const MAINTENANCE_CATEGORIES = ['ac', 'plumbing', 'electrical', 'lock_door', 'painting', 'structural', 'other'] as const

export default function Maintenance() {
  const { language } = useAppStore()
  const lang = language as Language
  const [items, setItems] = useState<MaintenanceData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceData | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'pending',
    category: '', vendor: '', estimatedCost: 0, actualCost: 0, propertyId: '',
  })

  const fetchData = useCallback(() => {
    try {
      const store = useDataStore.getState()
      setItems(store.maintenanceItems)
      setProperties(store.getPropertiesWithTenants())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setForm({ title: '', description: '', priority: 'medium', status: 'pending', category: '', vendor: '', estimatedCost: 0, actualCost: 0, propertyId: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: MaintenanceData) => {
    setEditing(item)
    setForm({
      title: item.title, description: item.description, priority: item.priority,
      status: item.status, category: item.category || '', vendor: item.vendor || '',
      estimatedCost: item.estimatedCost || 0, actualCost: item.actualCost || 0, propertyId: item.propertyId || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const store = useDataStore.getState()
    const body = {
      ...form,
      category: form.category || null,
      vendor: form.vendor || null,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
      actualCost: form.actualCost ? Number(form.actualCost) : null,
      propertyId: form.propertyId && form.propertyId !== 'none' ? form.propertyId : null,
    }
    if (editing) {
      store.updateMaintenance(editing.id, body)
    } else {
      store.addMaintenance(body)
    }
    setDialogOpen(false)
    fetchData()
  }

  const updateStatus = (id: string, newStatus: string) => {
    const updates: any = { status: newStatus }
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString()
    }
    useDataStore.getState().updateMaintenance(id, updates)
    fetchData()
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteTask', lang))) return
    useDataStore.getState().deleteMaintenance(id)
    fetchData()
  }

  const columns = [
    { status: 'pending', label: t('pending', lang), color: 'border-t-amber-500' },
    { status: 'in-progress', label: t('inProgress', lang), color: 'border-t-blue-500' },
    { status: 'completed', label: t('completed', lang), color: 'border-t-emerald' },
  ]

  const priorityLabels: Record<string, string> = {
    urgent: t('urgent', lang),
    high: t('high', lang),
    medium: t('medium', lang),
    low: t('low', lang),
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('maintenance', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} {t('tasksCount', lang)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTask', lang)}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const columnItems = items.filter(i => i.status === col.status)
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">{columnItems.length}</Badge>
                </div>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {columnItems.map(item => (
                  <Card key={item.id} className={`card-hover border-t-4 ${col.color}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm flex-1">{item.title}</h4>
                        <div className="flex gap-1 shrink-0 ml-2">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(item.id, 'in-progress')}
                              className="p-1 rounded hover:bg-blue-50 text-blue-500"
                              title={t('start', lang)}
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.status === 'in-progress' && (
                            <button
                              onClick={() => updateStatus(item.id, 'completed')}
                              className="p-1 rounded hover:bg-emerald/10 text-emerald"
                              title={t('complete', lang)}
                            >
                              ✓
                            </button>
                          )}
                          <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-muted text-muted-foreground text-xs">✎</button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 text-red-400 text-xs">✕</button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {priorityLabels[item.priority] || item.priority}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {getMaintenanceCategoryLabel(item.category, lang)}
                          </Badge>
                        )}
                        {item.estimatedCost ? (
                          <span className="text-xs font-medium text-foreground">
                            {t('estimatedCost', lang).replace(' (AED)', '')}: {formatAED(item.estimatedCost)}
                          </span>
                        ) : null}
                        {item.actualCost ? (
                          <span className="text-xs font-medium text-terracotta">
                            {t('actualCost', lang).replace(' (AED)', '')}: {formatAED(item.actualCost)}
                          </span>
                        ) : null}
                        {item.vendor && (
                          <span className="text-xs text-muted-foreground">
                            {item.vendor}
                          </span>
                        )}
                        {item.propertyId && (() => {
                          const prop = properties.find(p => p.id === item.propertyId)
                          return prop ? <span className="text-xs text-muted-foreground">{getNameByLang(prop, lang)}</span> : null
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    {t('noTasks', lang)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editTask', lang) : t('addTask', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('title', lang)}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('category', lang)}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{getMaintenanceCategoryLabel(cat, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('vendor', lang)}</Label>
                <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={t('vendor', lang)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('priority', lang)}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('low', lang)}</SelectItem>
                    <SelectItem value="medium">{t('medium', lang)}</SelectItem>
                    <SelectItem value="high">{t('high', lang)}</SelectItem>
                    <SelectItem value="urgent">{t('urgent', lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('status', lang)}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('pending', lang)}</SelectItem>
                    <SelectItem value="in-progress">{t('inProgress', lang)}</SelectItem>
                    <SelectItem value="completed">{t('completed', lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('estimatedCost', lang)}</Label>
                <Input type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('actualCost', lang)}</Label>
                <Input type="number" value={form.actualCost} onChange={e => setForm({ ...form, actualCost: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>{t('property', lang)}</Label>
              <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder={t('selectProperty', lang)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none', lang)}</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getNameByLang(p, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.title}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

---

### src/components/expenses.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ExpenseData, PropertyData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, formatDate, getCategoryIcon } from '@/lib/utils'
import { t, getExpenseCategoryLabel, getNameByLang, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Receipt, Plus, Pencil, Trash2, TrendingDown, Loader2, ShieldAlert } from 'lucide-react'

const EXPENSE_CATEGORIES = ['maintenance', 'utility', 'insurance', 'manpower', 'municipality', 'leasing', 'security', 'other'] as const

export default function Expenses() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseData | null>(null)
  const [form, setForm] = useState({
    category: 'maintenance', description: '', amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: '', invoiceNumber: '', recurring: false, building: '',
  })

  // Access control: Owner/Admin only
  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const fetchExpenses = useCallback(() => {
    try {
      const store = useDataStore.getState()
      setExpenses(store.expenses)
      setProperties(store.getPropertiesWithTenants())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openNew = () => {
    setEditing(null)
    setForm({
      category: 'maintenance', description: '', amount: 0,
      date: new Date().toISOString().split('T')[0],
      vendor: '', invoiceNumber: '', recurring: false, building: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (e: ExpenseData) => {
    setEditing(e)
    setForm({
      category: e.category, description: e.description, amount: e.amount,
      date: new Date(e.date).toISOString().split('T')[0],
      vendor: e.vendor || '', invoiceNumber: e.invoiceNumber || '',
      recurring: e.recurring || false, building: e.building || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const store = useDataStore.getState()
    const body = {
      ...form,
      amount: Number(form.amount),
      vendor: form.vendor || null,
      invoiceNumber: form.invoiceNumber || null,
      recurring: form.recurring,
      building: form.building || null,
    }
    if (editing) {
      store.updateExpense(editing.id, body)
    } else {
      store.addExpense(body)
    }
    setDialogOpen(false)
    fetchExpenses()
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteExpense', lang))) return
    useDataStore.getState().deleteExpense(id)
    fetchExpenses()
  }

  const filtered = expenses.filter(e => categoryFilter === 'all' || e.category === categoryFilter)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthlyTotal = expenses
    .filter(e => { const d = new Date(e.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear })
    .reduce((s, e) => s + e.amount, 0)

  const categoryTotals: Record<string, number> = {}
  for (const e of expenses.filter(e => { const d = new Date(e.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear })) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ShieldAlert className="w-12 h-12 text-terracotta" />
        <h2 className="text-xl font-bold">{t('accessDenied', lang)}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('expenses', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {expenses.length} {t('expensesCount', lang)}
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald hover:bg-emerald/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addExpense', lang)}
        </Button>
      </div>

      {/* Monthly Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('thisMonthTotal', lang)}</p>
            <p className="text-2xl font-bold text-terracotta mt-1">{formatAED(monthlyTotal)}</p>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <Card key={cat} className="card-hover">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                {getCategoryIcon(cat)} {getExpenseCategoryLabel(cat, lang)}
              </p>
              <p className="text-xl font-bold mt-1">{formatAED(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
          className={categoryFilter === 'all' ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
        >
          {t('all', lang)}
        </Button>
        {EXPENSE_CATEGORIES.map(c => (
          <Button
            key={c}
            variant={categoryFilter === c ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(c)}
            className={categoryFilter === c ? 'bg-emerald hover:bg-emerald/90 text-white' : ''}
          >
            {getCategoryIcon(c)} {getExpenseCategoryLabel(c, lang)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('category', lang)}</TableHead>
                  <TableHead>{t('description', lang)}</TableHead>
                  <TableHead>{t('amount', lang)}</TableHead>
                  <TableHead>{t('date', lang)}</TableHead>
                  <TableHead>{t('vendor', lang)}</TableHead>
                  <TableHead>{t('invoiceNumber', lang)}</TableHead>
                  <TableHead>{t('recurring', lang)}</TableHead>
                  <TableHead className="text-right">{t('actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryIcon(expense.category)} {getExpenseCategoryLabel(expense.category, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{expense.description}</TableCell>
                    <TableCell className="font-semibold text-sm text-terracotta">{formatAED(expense.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-sm">{expense.vendor || '—'}</TableCell>
                    <TableCell className="text-sm">{expense.invoiceNumber || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {expense.recurring ? (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t('recurring', lang)}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('oneTime', lang)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(expense)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('noExpensesFound', lang)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editExpense', lang) : t('addExpense', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('category', lang)}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{getCategoryIcon(cat)} {getExpenseCategoryLabel(cat, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('amount', lang)}</Label>
                <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('date', lang)}</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('vendor', lang)}</Label>
                <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={t('vendor', lang)} />
              </div>
              <div>
                <Label>{t('invoiceNumber', lang)}</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder={t('invoiceNumber', lang)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="recurring"
                  checked={form.recurring}
                  onCheckedChange={(checked) => setForm({ ...form, recurring: !!checked })}
                />
                <Label htmlFor="recurring" className="cursor-pointer">{t('recurring', lang)}</Label>
              </div>
              <div>
                <Label>{t('building', lang)}</Label>
                <Select value={form.building} onValueChange={v => setForm({ ...form, building: v })}>
                  <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none', lang)}</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={getNameByLang(p, lang)}>{getNameByLang(p, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleSave} className="bg-emerald hover:bg-emerald/90 text-white" disabled={!form.description || form.amount <= 0}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

---

### src/components/reports.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ReportData } from '@/lib/types'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { formatAED, getCategoryIcon } from '@/lib/utils'
import { t, getMonthName, getExpenseCategoryLabel, type Language } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  BarChart3,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

const PIE_COLORS = ['#0D7C3D', '#C5A028', '#0A5C4E', '#C4653A', '#8b5cf6', '#ef4444', '#06b6d4']

export default function Reports() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Access control: Owner/Admin only
  const canAccess = authUser && isOwnerOrAdmin(authUser.role)

  const fetchData = useCallback(() => {
    try {
      const reportData = useDataStore.getState().getReportData(selectedMonth, selectedYear)
      if (reportData) setData(reportData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <ShieldAlert className="w-12 h-12 text-terracotta" />
        <h2 className="text-xl font-bold">{t('accessDenied', lang)}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', lang)}</p>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t('noData', lang)}</div>
  }

  const expensePieData = Object.entries(data.expenseBreakdown).map(([key, value]) => ({
    name: getExpenseCategoryLabel(key, lang),
    value,
  }))

  const trendChartData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }))

  // Revenue analysis monthly trend data
  const revenueTrendData = data.trend.map(item => ({
    month: getMonthName(item.month, lang),
    revenue: item.revenue,
    expected: data.expectedRevenue,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">{t('reports', lang)}</h1>
        </div>
        <Button onClick={handlePrint} variant="outline" className="border-emerald text-emerald">
          <Download className="w-4 h-4 mr-2" />
          {t('printReport', lang)}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {getMonthName(selectedMonth, lang)} {selectedYear}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover border-l-4 border-l-emerald">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <p className="text-xs text-muted-foreground">{t('revenue', lang)}</p>
            </div>
            <p className="text-xl font-bold text-emerald">{formatAED(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ofExpected', lang)} {formatAED(data.expectedRevenue)} {t('expected', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-terracotta">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-terracotta" />
              <p className="text-xs text-muted-foreground">{t('expenses', lang)}</p>
            </div>
            <p className="text-xl font-bold text-terracotta">{formatAED(data.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`card-hover border-l-4 ${data.profitLoss >= 0 ? 'border-l-emerald' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-500'}`} />
              <p className="text-xs text-muted-foreground">{t('profitOrLoss', lang)}</p>
            </div>
            <p className={`text-xl font-bold ${data.profitLoss >= 0 ? 'text-emerald' : 'text-red-600'}`}>
              {formatAED(data.profitLoss)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-deep-teal">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-deep-teal" />
              <p className="text-xs text-muted-foreground">{t('collectionRate', lang)}</p>
            </div>
            <p className="text-xl font-bold text-deep-teal">{data.collectionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.occupiedUnits}/{data.totalUnits} {t('occupiedUnits', lang).toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('sixMonthTrend', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatAED(value)}
                    contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name={t('revenue', lang)} fill="#0D7C3D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('expenses', lang)} fill="#C4653A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('expenseBreakdown', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAED(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald" />
            {t('revenueAnalysis', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend Line Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('monthlyTrend', lang)}</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatAED(value)}
                      contentStyle={{ backgroundColor: '#FFF8E7', border: '1px solid #e5e0d5', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name={t('revenue', lang)} stroke="#0D7C3D" fill="#0D7C3D" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('totalRevenue', lang)}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald" />
                    <span className="text-sm">{t('rentalIncome', lang)}</span>
                  </div>
                  <span className="font-semibold text-emerald">{formatAED(data.rentalIncome)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t('otherIncome', lang)}</span>
                  </div>
                  <span className="font-semibold">{formatAED(data.otherIncome)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between p-3 rounded-lg bg-emerald/10">
                  <span className="text-sm font-semibold">{t('grossRevenue', lang)}</span>
                  <span className="font-bold text-emerald">{formatAED(data.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('vacancyLoss', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.vacancyLoss)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{t('badDebt', lang)}</span>
                  </div>
                  <span className="font-semibold text-red-500">-{formatAED(data.badDebt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald" />
            {t('profitAndLoss', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-emerald/5">
              <span className="text-sm font-medium">{t('rentalIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-emerald text-right">{formatAED(data.rentalIncome)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-muted/30">
              <span className="text-sm">{t('otherIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-semibold text-right">{formatAED(data.otherIncome)}</span>
            </div>

            {/* Gross Revenue */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-emerald/30 bg-emerald/5">
              <span className="text-sm font-bold">{t('grossRevenue', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className="font-bold text-emerald text-right">{formatAED(data.grossRevenue)}</span>
            </div>

            {/* Deductions */}
            <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3">
              {t('costOfOperations', lang)}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('vacancyLoss', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.vacancyLoss)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('badDebt', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.badDebt)}</span>
            </div>

            {/* Gross Profit */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg border-t-2 border-b border-amber-300 bg-amber-50">
              <span className="text-sm font-bold">{t('grossProfit', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <span className={`font-bold text-right ${data.grossProfit >= 0 ? 'text-emerald' : 'text-red-600'}`}>{formatAED(data.grossProfit)}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm">{t('operatingExpenses', lang)}</span>
              <span className="text-sm text-red-400">-</span>
              <span className="font-semibold text-red-500 text-right">{formatAED(data.costOfOperations)}</span>
            </div>

            {/* Net Income */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-4 rounded-lg border-2 border-emerald bg-emerald/10">
              <span className="text-base font-bold">{t('netIncome', lang)}</span>
              <span className="text-sm text-muted-foreground">{ }</span>
              <div className="flex items-center gap-2">
                {data.netIncome >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald" />
                ) : data.netIncome < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                ) : (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-lg font-bold text-right ${data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}`}>
                  {formatAED(data.netIncome)}
                </span>
              </div>
            </div>

            {/* Margin indicator */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              <span>{t('collectionRate', lang)}: <strong className="text-foreground">{data.collectionRate}%</strong></span>
              <span>|</span>
              <span>{t('occupancyRate', lang)}: <strong className="text-foreground">{data.occupancyRate}%</strong></span>
              <span>|</span>
              <span>{t('netProfit', lang)}: <strong className={data.netIncome >= 0 ? 'text-emerald' : 'text-red-600'}>
                {data.grossRevenue > 0 ? ((data.netIncome / data.grossRevenue) * 100).toFixed(1) : 0}%
              </strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('expenseDetails', lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.monthlyExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(e.category)}</span>
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getExpenseCategoryLabel(e.category, lang)}
                      </Badge>
                      {e.vendor && <span className="text-xs text-muted-foreground">{e.vendor}</span>}
                      {e.recurring && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t('recurring', lang)}</Badge>}
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-terracotta">{formatAED(e.amount)}</span>
              </div>
            ))}
            {data.monthlyExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noExpensesMonth', lang)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

```

---

### src/components/contracts.tsx

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { t, getNameByLang, getMonthName } from '@/lib/i18n'
import { formatAED, formatDate, cn2 } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function Contracts() {
  const { language } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired' | 'active'>('all')

  const fetchData = useCallback(() => {
    try {
      const tenants = useDataStore.getState().getTenantsWithRelations()
      setTenants(tenants)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const now = new Date()

  const getContractStatus = (tenant: TenantData): 'active' | 'expiring' | 'expired' | 'no-contract' => {
    if (!tenant.leaseEnd) return 'no-contract'
    const endDate = new Date(tenant.leaseEnd)
    const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil < 0) return 'expired'
    if (daysUntil <= 60) return 'expiring'
    return 'active'
  }

  const getDaysUntilExpiry = (leaseEnd: string | null): number | null => {
    if (!leaseEnd) return null
    return Math.ceil((new Date(leaseEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const filtered = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.nameAr && tenant.nameAr.includes(search)) ||
      (tenant.nameBn && tenant.nameBn.includes(search)) ||
      tenant.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.emiratesId?.includes(search)

    const status = getContractStatus(tenant)
    const matchesFilter = filter === 'all' || filter === status

    return matchesSearch && matchesFilter && tenant.status === 'active'
  })

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  const expiringCount = tenants.filter(t => getContractStatus(t) === 'expiring').length
  const expiredCount = tenants.filter(t => getContractStatus(t) === 'expired').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('contractTracker', language)}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tenants.filter(t => t.status === 'active').length} {t('activeTenants', language).toLowerCase()}
        </p>
      </div>

      {/* Alert for expiring/expired */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {expiringCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-amber-800">{expiringCount} {t('expiringSoon', language)}</p>
                <p className="text-amber-600 text-sm">{t('daysUntilExpiry', language)} &lt; 60</p>
              </div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-800">{expiredCount} {t('expired', language)}</p>
                <p className="text-red-600 text-sm">{t('renewalStatus', language)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchTenants', language)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-deep-teal hover:bg-deep-teal/90 text-white' : ''}
            >
              {f === 'all' && t('all', language)}
              {f === 'active' && t('active', language)}
              {f === 'expiring' && t('expiringSoon', language)}
              {f === 'expired' && t('expired', language)}
            </Button>
          ))}
        </div>
      </div>

      {/* Contract cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filtered.map(tenant => {
          const contractStatus = getContractStatus(tenant)
          const daysUntil = getDaysUntilExpiry(tenant.leaseEnd)

          return (
            <Card key={tenant.id} className={cn2(
              'card-hover',
              contractStatus === 'expired' && 'ring-1 ring-red-300',
              contractStatus === 'expiring' && 'ring-1 ring-amber-300'
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn2(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      contractStatus === 'active' ? 'bg-emerald/10' : contractStatus === 'expiring' ? 'bg-amber-100' : 'bg-red-100'
                    )}>
                      <FileText className={cn2(
                        'w-4 h-4',
                        contractStatus === 'active' ? 'text-emerald' : contractStatus === 'expiring' ? 'text-amber-500' : 'text-red-500'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{getNameByLang(tenant, language)}</h3>
                      <p className="text-xs text-muted-foreground">{tenant.unitNumber || '—'}</p>
                    </div>
                  </div>
                  <Badge className={cn2(
                    'text-xs',
                    contractStatus === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    contractStatus === 'expiring' ? 'bg-amber-100 text-amber-800' :
                    contractStatus === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {contractStatus === 'active' && <><CheckCircle className="w-3 h-3 mr-1" />{t('active', language)}</>}
                    {contractStatus === 'expiring' && <><Clock className="w-3 h-3 mr-1" />{t('expiringSoon', language)}</>}
                    {contractStatus === 'expired' && <><XCircle className="w-3 h-3 mr-1" />{t('expired', language)}</>}
                    {contractStatus === 'no-contract' && t('noContracts', language)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('monthlyRent', language)}</span>
                    <span className="font-semibold">{formatAED(tenant.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaseStart', language)}</span>
                    <span>{tenant.leaseStart ? formatDate(tenant.leaseStart) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaseEnd', language)}</span>
                    <span className={contractStatus === 'expired' ? 'text-red-600 font-semibold' : ''}>
                      {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '—'}
                    </span>
                  </div>
                  {daysUntil !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('daysUntilExpiry', language)}</span>
                      <span className={cn2(
                        'font-bold',
                        daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-amber-600' : 'text-emerald'
                      )}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} days past` : `${daysUntil} days`}
                      </span>
                    </div>
                  )}
                  {tenant.emiratesId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('emiratesId', language)}</span>
                      <span className="text-xs">{tenant.emiratesId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('tenantScore', language)}</span>
                    <Badge className={cn2(
                      'text-xs',
                      tenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      tenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-800' :
                      tenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {tenant.tenantScore}/100
                    </Badge>
                  </div>
                </div>

                {/* Geometric divider */}
                <div className="geometric-divider my-3" />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tenant.property?.name || '—'}</span>
                  <span>•</span>
                  <span>{tenant.nationality || '—'}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('noContracts', language)}
        </div>
      )}
    </div>
  )
}

```

---

### src/hooks/use-mobile.ts

```typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

---

### src/hooks/use-toast.ts

```typescript
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
    type: ActionType["ADD_TOAST"]
    toast: ToasterToast
  }
  | {
    type: ActionType["UPDATE_TOAST"]
    toast: Partial<ToasterToast>
  }
  | {
    type: ActionType["DISMISS_TOAST"]
    toastId?: ToasterToast["id"]
  }
  | {
    type: ActionType["REMOVE_TOAST"]
    toastId?: ToasterToast["id"]
  }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
              ...t,
              open: false,
            }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

---

### public/robots.txt

```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

```

---


## 13. Key Design Decisions

### 13.1 Client-Side Storage (No Backend)

The application uses Zustand with localStorage persistence instead of a traditional backend database. This decision was made because:
- Zero infrastructure cost (no database server, no API hosting)
- Instant deployment to Vercel as a static/CSR application
- Data privacy - all data stays in the user's browser
- Simplicity - no Prisma migrations, no API routes, no connection strings
- Offline capability - the app works without internet after initial load

**Trade-off:** Data is device-specific and cannot be shared across devices without export/import. This is acceptable for a single-user business owner scenario.

### 13.2 Multi-Language Support (4 Languages)

The 4-language system (English, Arabic, Bengali, Urdu) was chosen because:
- The business owner is Bengali (Bengali language)
- Properties are in Abu Dhabi, UAE (Arabic language)
- Many tenants are Pakistani/Urdu-speaking (Urdu language)
- English is the universal business language
- This covers the vast majority of the tenant demographic

### 13.3 Role-Based Access (Owner/Admin/Staff)

The RBAC system prevents staff from viewing financial data because:
- Staff typically handle tenant relations and maintenance coordination
- Revenue, expenses, and profit data should only be visible to the business owner
- This mirrors real-world trust boundaries in family-run businesses

### 13.4 No Prisma ORM

The project does not use Prisma or any ORM because:
- All data is client-side in Zustand stores
- No SQL database is queried at runtime
- The `db/custom.db` SQLite file exists but is not actively used
- This eliminates the need for migrations, connection pooling, and server-side data access

### 13.5 Islamic Bengali Design Identity

The design deliberately incorporates:
- Islamic geometric patterns (8-pointed star motifs) on sidebar and login
- Green and gold color scheme (Islamic architecture colors)
- Bengali cultural accents (nakshi kantha embroidery patterns, Bangladesh flag colors)
- Moon icon (crescent moon symbolism)
- Arabic calligraphy-style header treatments

This ensures the dashboard feels culturally authentic rather than a generic SaaS product.

---

## 14. Known Limitations & Future Improvements

### 14.1 Current Limitations

1. **Single-device data:** localStorage is device-specific; no cross-device sync
2. **No data export/import:** Users cannot migrate data between browsers
3. **Plaintext passwords:** User credentials are stored in plain text in the Zustand store
4. **No audit trail:** Changes to data are not logged
5. **Limited reporting:** Reports are monthly only; no annual or custom date range
6. **No notifications:** No email or push notification system for overdue payments
7. **Seed data only:** Fresh installation starts empty; seed data is demo data, not real data

### 14.2 Recommended Improvements

1. **Add Supabase/Firebase backend** for cross-device sync and real authentication
2. **Implement data export/import** (JSON or CSV) for backup and migration
3. **Add password hashing** even for local auth
4. **Add annual reporting** with year-over-year comparisons
5. **Implement email/SMS notifications** for overdue payments
6. **Add multi-company support** for scaling to other property management clients
7. **Implement receipt generation** (PDF receipts for payments)
8. **Add unit floor plans** and document uploads
9. **Implement payment gateway integration** (online rent payment)
10. **Add mobile app** via React Native or PWA enhancements
