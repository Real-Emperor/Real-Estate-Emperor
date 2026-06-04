# Task: Implement Real PDF Receipt Generation

## Summary
Replaced the JSON-only receipt PDF endpoint with actual PDF generation using the `pdfkit` library.

## Changes Made

### 1. Installed `pdfkit` and `@types/pdfkit`
- `npm install pdfkit` — core PDF generation library
- `npm install -D @types/pdfkit` — TypeScript type definitions

### 2. Rewrote `/src/app/api/receipts/[id]/pdf/route.ts`
The previous implementation just returned JSON data via `successResponse(serialize(receipt))`. The new implementation:

- Generates a real A4 PDF document using pdfkit
- Includes a **teal header** with company name (English + Arabic if available)
- Shows a **receipt number badge** in gold
- Displays **date** in long format
- Draws a **"PAID" stamp** (rotated, bordered, teal-colored)
- Renders **tenant information** section (name, Arabic name, unit, phone)
- Creates a **payment details box** with columns: Description, Month, Year, Amount (AED)
- Shows **total amount** prominently in teal
- Includes **amount in words** (e.g., "One Thousand Five Hundred AED")
- Shows **payment reference** if available
- Adds a **footer** with company address, phone, email, and "Thank you" note
- Returns the PDF with proper headers: `Content-Type: application/pdf`, `Content-Disposition: inline`

### 3. Updated `next.config.ts`
Added `pdfkit` to `serverExternalPackages` alongside `bcryptjs` and `sharp` so Next.js doesn't try to bundle it for the client.

## Verification
- No lint errors in the route file
- PDFKit loads and works correctly in Node.js
- TypeScript types are available via `@types/pdfkit`
