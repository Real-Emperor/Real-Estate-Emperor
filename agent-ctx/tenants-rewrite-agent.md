# Task: Rewrite Tenants Component with 4-Language i18n, Scoring, and Enhanced Profile

## Summary

Completely rewrote `/home/z/my-project/src/components/tenants.tsx` with full 4-language i18n support (EN/AR/BN/UR), tenant scoring, Emirates ID, enhanced profile view, and role-based access control.

## Changes Made

### 1. `/home/z/my-project/src/lib/i18n.ts` - Added 18 new translation keys
- `nameEnglish`, `nameArabic`, `nameBengali`, `nameUrdu` - 4-language name labels
- `oneBedroom`, `twoBedroom`, `threeBedroom` - Unit type translations
- `selectProperty`, `tenantProfile` - UI labels
- `personalInfo`, `contactInfo`, `leaseInfo`, `financialInfo` - Profile section headers
- `months`, `late`, `onTime`, `building`, `autoCalc` - Additional labels
- `getPropertyTypeLabel()` - New function for property type translations

### 2. `/home/z/my-project/src/app/api/tenants/route.ts` - Updated API route
- POST handler now accepts all new fields: `nameBn`, `nameUr`, `whatsapp`, `emiratesId`, `nationality`, `employer`, `emergencyContact`, `unitType`, `floor`, `sizeSqft`, `municipalityFee`, `securityDeposit`, `paymentMethod`, `contractDuration`, `notes`
- PUT handler updated with same new fields and includes payments in response

### 3. `/home/z/my-project/src/components/tenants.tsx` - Complete rewrite (1007 lines)
**Imports**: Now uses `t()` from `@/lib/i18n`, `cn2/formatAED/formatDate/getStatusColor` from `@/lib/utils`, `useAppStore/isOwnerOrAdmin` from `@/lib/store`

**Key Features**:
- **4-language i18n**: All text uses `t('key', language)`, names displayed via `getNameByLang()`
- **Tenant Score Display**: Colored badge in table (green ≥80, blue ≥60, amber ≥40, red <40)
- **Late Payment Indicator**: Small badge with count and warning icon
- **Tenant Profile Dialog**: Full detailed profile with sections for:
  - Score & Late Payments (prominent display with color coding)
  - Personal Information (name, Emirates ID, nationality, employer)
  - Contact Information (phone, WhatsApp, email, emergency contact)
  - Lease Information (building, unit, type, floor, size, dates, duration)
  - Financial Information (rent, municipality fee, security deposit, payment method)
  - Notes section
  - Full Payment History with late/on-time badges
  - WhatsApp reminder button
- **Enhanced Form Dialog**: All new fields including:
  - 4 name fields (English, Arabic, Bengali, Urdu)
  - Contact details with WhatsApp
  - Emirates ID, nationality, employer, emergency contact
  - Unit type/floor/size fields
  - Municipality fee auto-calculation (5% of rent)
  - Payment method dropdown
  - Contract duration, notes
- **Role-based Access**: Staff cannot delete tenants or see security deposit amounts
- **Expandable Rows**: Payment history with late payment highlighting

### 4. Fixed pre-existing import issues in other components
- `/home/z/my-project/src/components/rent-collection.tsx` - Fixed `getMonthName/getWhatsAppLink` import from `@/lib/i18n`
- `/home/z/my-project/src/components/properties.tsx` - Fixed `getPropertyTypeLabel` import from `@/lib/i18n`
- `/home/z/my-project/src/components/reports.tsx` - Fixed `getMonthName` import from `@/lib/i18n`

## Verification
- `bun run lint` passes with no errors in source files
- Dev server returns HTTP 200
- Page renders successfully
