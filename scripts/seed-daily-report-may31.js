/**
 * Seed script: Comprehensive sample dataset for 31 May 2026
 * Creates high-volume, realistic credit (rent) and debit (expense) transactions
 * for thorough testing/validation of the Daily Expenses Report (PDF & XLSX).
 *
 * Usage: node scripts/seed-daily-report-may31.js
 */

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://neondb_owner:npg_wB1fOmTSF0ji@ep-still-sound-abnl454x.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

const TARGET_DATE = '2026-05-31';
const CID = 'company-1';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEED: Comprehensive Daily Data for 31 May 2026');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ─── Step 1: Fetch existing tenants ───
  console.log('1. Fetching existing tenants...');
  const tenants = await prisma.tenant.findMany({
    where: { companyId: CID, deletedAt: null, status: 'active' },
    include: { property: true },
  });
  console.log(`   Found ${tenants.length} active tenants\n`);

  if (tenants.length === 0) {
    console.error('   ERROR: No active tenants found. Run the main seed first.');
    process.exit(1);
  }

  // Group tenants by property for realistic grouping
  const tenantsByProperty = {};
  for (const t of tenants) {
    const key = t.property?.name || 'Unknown';
    if (!tenantsByProperty[key]) tenantsByProperty[key] = [];
    tenantsByProperty[key].push(t);
  }
  for (const [prop, ts] of Object.entries(tenantsByProperty)) {
    console.log(`   ${prop}: ${ts.length} tenants`);
  }
  console.log('');

  // ─── Step 2: Create Income (Rent Payments) for 31 May 2026 ───
  // Simulate a busy rent collection day with 24 payments across the day
  // Mix of full payments, partial payments, different methods, different times
  console.log('2. Creating income (rent payments) for 31 May 2026...');

  const paymentsToCreate = [
    // ── Early morning collections (8:00 AM - 9:30 AM) ──
    // Tenants who come to the office early to pay
    { tenantIdx: 0, amount: 1800, method: 'bank_transfer', hour: 8, min: 5, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 3, amount: 1600, method: 'bank_transfer', hour: 8, min: 22, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 4, amount: 2800, method: 'cash', hour: 8, min: 45, isLate: false, daysLate: 0, notes: null },

    // ── Morning wave (9:30 AM - 11:30 AM) ──
    // Bank transfer batch processed
    { tenantIdx: 7, amount: 3800, method: 'cheque', hour: 9, min: 10, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 8, amount: 4200, method: 'bank_transfer', hour: 9, min: 30, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 9, amount: 2500, method: 'bank_transfer', hour: 9, min: 55, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 12, amount: 2400, method: 'cash', hour: 10, min: 15, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 13, amount: 2700, method: 'bank_transfer', hour: 10, min: 40, isLate: false, daysLate: 0, notes: null },

    // ── Late morning (11:00 AM - 12:30 PM) ──
    { tenantIdx: 15, amount: 4000, method: 'cheque', hour: 11, min: 5, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 16, amount: 2300, method: 'bank_transfer', hour: 11, min: 30, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 17, amount: 4500, method: 'bank_transfer', hour: 11, min: 50, isLate: false, daysLate: 0, notes: null },

    // ── Afternoon wave (1:00 PM - 3:00 PM) ──
    // After lunch, another batch
    { tenantIdx: 22, amount: 3500, method: 'bank_transfer', hour: 13, min: 15, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 23, amount: 2900, method: 'bank_transfer', hour: 13, min: 40, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 25, amount: 2500, method: 'bank_transfer', hour: 14, min: 10, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 26, amount: 3800, method: 'bank_transfer', hour: 14, min: 35, isLate: false, daysLate: 0, notes: null },

    // ── Late afternoon (3:30 PM - 5:00 PM) ──
    { tenantIdx: 29, amount: 1800, method: 'cheque', hour: 15, min: 20, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 30, amount: 4000, method: 'cash', hour: 15, min: 50, isLate: false, daysLate: 0, notes: null },
    { tenantIdx: 31, amount: 3500, method: 'cash', hour: 16, min: 15, isLate: false, daysLate: 0, notes: null },

    // ── LATE PAYMENTS ──
    // These tenants are paying late (May rent due on May 1, now paying on May 31)
    { tenantIdx: 5, amount: 3000, method: 'bank_transfer', hour: 16, min: 45, isLate: true, daysLate: 30, notes: 'Late payment - May rent' },
    { tenantIdx: 20, amount: 2000, method: 'bank_transfer', hour: 17, min: 5, isLate: true, daysLate: 30, notes: 'Late payment - May rent' },
    { tenantIdx: 34, amount: 2600, method: 'bank_transfer', hour: 17, min: 20, isLate: true, daysLate: 30, notes: 'Late payment - May rent' },

    // ── PARTIAL PAYMENTS ──
    // Some tenants can't pay full rent
    { tenantIdx: 6, amount: 1500, method: 'cash', hour: 17, min: 30, isLate: true, daysLate: 30, notes: 'Partial payment - balance outstanding' },
    { tenantIdx: 28, amount: 1000, method: 'cash', hour: 17, min: 45, isLate: true, daysLate: 30, notes: 'Partial payment - balance outstanding' },

    // ── Evening / last minute ──
    { tenantIdx: 32, amount: 1400, method: 'cash', hour: 18, min: 10, isLate: false, daysLate: 0, notes: null },
  ];

  let paymentCount = 0;
  const totalIncomeExpected = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);

  for (const p of paymentsToCreate) {
    if (p.tenantIdx >= tenants.length) {
      console.log(`   SKIP: tenantIdx ${p.tenantIdx} out of range (only ${tenants.length} tenants)`);
      continue;
    }
    const tenant = tenants[p.tenantIdx];
    const paymentDate = new Date(2026, 4, 31, p.hour, p.min, 0); // May 31, 2026

    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        amount: p.amount,
        date: paymentDate,
        month: 5,
        year: 2026,
        method: p.method,
        reference: `RCP-052026-${tenant.unitNumber || tenant.id.slice(-4)}`,
        isLate: p.isLate,
        daysLate: p.daysLate,
        notes: p.notes,
      },
    });
    paymentCount++;
  }

  console.log(`   Created ${paymentCount} payments totaling AED ${totalIncomeExpected.toLocaleString()}\n`);

  // ─── Step 3: Create Expenses for 31 May 2026 ───
  // High-volume, diverse operational expenses across the day
  console.log('3. Creating expenses for 31 May 2026...');

  const expensesToCreate = [
    // ── MANPOWER (recurring monthly staff costs) ──
    { category: 'manpower', description: 'Building security staff - May salary', amount: 12000, vendor: 'SafeGuard Security LLC', invoiceNumber: 'INV-SG-0526', recurring: true, building: 'All Buildings', hour: 9, min: 0 },
    { category: 'manpower', description: 'Building cleaners - May salary', amount: 8000, vendor: 'CleanPro Services', invoiceNumber: 'INV-CP-0526', recurring: true, building: 'All Buildings', hour: 9, min: 15 },
    { category: 'manpower', description: 'Maintenance technicians - May salary', amount: 15000, vendor: 'Emperor Maintenance', invoiceNumber: 'INV-ARM-0526', recurring: true, building: 'All Buildings', hour: 9, min: 30 },
    { category: 'manpower', description: 'Reception & admin staff - May salary', amount: 6000, vendor: 'Emperor Maintenance', invoiceNumber: 'INV-ARM-A0526', recurring: true, building: 'All Buildings', hour: 9, min: 45 },
    { category: 'salary', description: 'Office management salaries - May', amount: 25000, vendor: 'Internal Payroll', invoiceNumber: 'SAL-052026', recurring: true, building: 'All Buildings', hour: 10, min: 0 },

    // ── MUNICIPALITY FEES ──
    { category: 'municipality', description: 'Abu Dhabi Municipality fees - Q2 2026', amount: 8500, vendor: 'Abu Dhabi Municipality', invoiceNumber: 'MUN-Q2-2026', recurring: true, building: 'All Buildings', hour: 10, min: 30 },

    // ── UTILITIES ──
    { category: 'utility', description: 'Electricity bill - May 2026', amount: 5800, vendor: 'ADDC (Abu Dhabi Distribution Co.)', invoiceNumber: 'ADDC-E-0526', recurring: true, building: 'All Buildings', hour: 11, min: 0 },
    { category: 'utility', description: 'Water supply bill - May 2026', amount: 3200, vendor: 'ADDC (Abu Dhabi Distribution Co.)', invoiceNumber: 'ADDC-W-0526', recurring: true, building: 'All Buildings', hour: 11, min: 10 },
    { category: 'utility', description: 'District cooling (chiller) - May 2026', amount: 4800, vendor: 'Tabreed', invoiceNumber: 'TAB-052026', recurring: true, building: 'All Buildings', hour: 11, min: 20 },
    { category: 'utility', description: 'Gas supply - May 2026', amount: 1300, vendor: 'ADNOC Gas', invoiceNumber: 'GAS-052026', recurring: true, building: 'All Buildings', hour: 11, min: 30 },

    // ── MAINTENANCE (mix of recurring and one-time) ──
    { category: 'maintenance', description: 'Elevator maintenance - Real Estate Emperor Bldg 1 (May)', amount: 1800, vendor: 'Schindler Elevators', invoiceNumber: 'SCH-ARJ1-0526', recurring: true, building: 'Real Estate Emperor - Building 1', hour: 12, min: 0 },
    { category: 'maintenance', description: 'Elevator maintenance - Real Estate Emperor Bldg 2 (May)', amount: 1700, vendor: 'Schindler Elevators', invoiceNumber: 'SCH-ARJ2-0526', recurring: true, building: 'Real Estate Emperor - Building 2', hour: 12, min: 15 },
    { category: 'maintenance', description: 'Elevator maintenance - Emperor Heights Bldg 1 (May)', amount: 1600, vendor: 'Schindler Elevators', invoiceNumber: 'SCH-RAM1-0526', recurring: true, building: 'Emperor Heights - Building 1', hour: 12, min: 30 },
    { category: 'maintenance', description: 'Elevator maintenance - Emperor Heights Bldg 2 (May)', amount: 1500, vendor: 'Schindler Elevators', invoiceNumber: 'SCH-RAM2-0526', recurring: true, building: 'Emperor Heights - Building 2', hour: 12, min: 45 },
    { category: 'maintenance', description: 'AC compressor replacement - Unit 202', amount: 3500, vendor: 'CoolTech Services', invoiceNumber: 'CT-AC202-0531', recurring: false, building: 'Real Estate Emperor - Building 1', hour: 13, min: 30 },
    { category: 'maintenance', description: 'Emergency plumbing repair - Unit 303 kitchen', amount: 750, vendor: 'Al Fix Plumbing', invoiceNumber: 'AFP-303-0531', recurring: false, building: 'Emperor Heights - Building 2', hour: 14, min: 0 },
    { category: 'maintenance', description: 'Staircase lighting replacement - Floors 3-5', amount: 420, vendor: 'SafeWire Electric', invoiceNumber: 'SWE-LT-0531', recurring: false, building: 'Real Estate Emperor - Building 2', hour: 14, min: 30 },
    { category: 'maintenance', description: 'Intercom system repair - Main panel', amount: 1850, vendor: 'SafeWire Electric', invoiceNumber: 'SWE-IC-0531', recurring: false, building: 'Real Estate Emperor - Building 2', hour: 15, min: 0 },

    // ── FUEL / TRANSPORT ──
    { category: 'other', description: 'Fuel for site visits & inspections - May', amount: 2800, vendor: 'ADNOC Distribution', invoiceNumber: 'FUEL-052026', recurring: true, building: 'All Buildings', hour: 8, min: 30 },
    { category: 'other', description: 'Vehicle maintenance - company car service', amount: 1200, vendor: 'AutoCare Workshop', invoiceNumber: 'AC-0531', recurring: false, building: 'All Buildings', hour: 15, min: 30 },

    // ── SECURITY ──
    { category: 'security', description: 'CCTV monitoring service - May 2026', amount: 6000, vendor: 'SafeGuard Security LLC', invoiceNumber: 'INV-SG-CCTV-0526', recurring: true, building: 'All Buildings', hour: 10, min: 15 },
    { category: 'security', description: 'Fire extinguisher annual replacement - Bldg 1', amount: 950, vendor: 'FirePro Safety', invoiceNumber: 'FPS-B1-0531', recurring: false, building: 'Real Estate Emperor - Building 1', hour: 14, min: 15 },

    // ── INSURANCE ──
    { category: 'insurance', description: 'Building property insurance - Q2 2026', amount: 2800, vendor: 'Oman Insurance Company', invoiceNumber: 'POL-Q2-2026', recurring: true, building: 'All Buildings', hour: 11, min: 45 },

    // ── LEASING ──
    { category: 'leasing', description: 'Leasing commission - 1 new tenant (Unit 105)', amount: 2300, vendor: 'Emperor Leasing', invoiceNumber: 'LC-0531', recurring: false, building: 'Real Estate Emperor - Building 1', hour: 16, min: 0 },

    // ── WATER (additional/separate from utility) ──
    { category: 'utility', description: 'Sewerage service charge - May', amount: 900, vendor: 'Abu Dhabi Sewerage Services', invoiceNumber: 'ADSS-052026', recurring: true, building: 'All Buildings', hour: 11, min: 50 },

    // ── ONE-TIME / OPERATIONAL ──
    { category: 'other', description: 'Office supplies & printing', amount: 450, vendor: 'Emirates Stationery', invoiceNumber: 'ES-0531', recurring: false, building: 'All Buildings', hour: 16, min: 30 },
    { category: 'other', description: 'Pest control treatment - All buildings', amount: 3500, vendor: 'PestGuard UAE', invoiceNumber: 'PG-0531', recurring: false, building: 'All Buildings', hour: 13, min: 0 },
    { category: 'maintenance', description: 'Roof waterproofing repair - Emperor Heights Bldg 2', amount: 8500, vendor: 'WaterShield LLC', invoiceNumber: 'WS-RM2-0531', recurring: false, building: 'Emperor Heights - Building 2', hour: 8, min: 0 },
    { category: 'other', description: 'Waste collection service - May', amount: 1800, vendor: 'Tadweer Waste Management', invoiceNumber: 'TAD-052026', recurring: true, building: 'All Buildings', hour: 9, min: 50 },
    { category: 'other', description: 'Parking lot cleaning & line repainting', amount: 2800, vendor: 'ColorPro Painters', invoiceNumber: 'CP-PK-0531', recurring: false, building: 'Emperor Heights - Building 2', hour: 7, min: 30 },
    { category: 'utility', description: 'Emergency generator fuel top-up', amount: 2200, vendor: 'ADNOC Distribution', invoiceNumber: 'ADNOC-GEN-0531', recurring: false, building: 'All Buildings', hour: 7, min: 0 },
  ];

  let expenseCount = 0;
  const totalExpenseExpected = expensesToCreate.reduce((sum, e) => sum + e.amount, 0);

  for (const e of expensesToCreate) {
    const expenseDate = new Date(2026, 4, 31, e.hour, e.min, 0); // May 31, 2026

    await prisma.expense.create({
      data: {
        companyId: CID,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: expenseDate,
        vendor: e.vendor,
        invoiceNumber: e.invoiceNumber,
        recurring: e.recurring,
        building: e.building,
      },
    });
    expenseCount++;
  }

  console.log(`   Created ${expenseCount} expenses totaling AED ${totalExpenseExpected.toLocaleString()}\n`);

  // ─── Step 4: Summary ───
  const netPL = totalIncomeExpected - totalExpenseExpected;
  const margin = totalIncomeExpected > 0 ? ((netPL / totalIncomeExpected) * 100).toFixed(1) : '0';

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE — 31 May 2026 Dataset Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Total Income (Rent Payments):    AED ${totalIncomeExpected.toLocaleString()}  (${paymentCount} transactions)`);
  console.log(`  Total Expenses (Operational):    AED ${totalExpenseExpected.toLocaleString()}  (${expenseCount} transactions)`);
  console.log(`  Net Profit/Loss:                 AED ${netPL.toLocaleString()}`);
  console.log(`  Profit Margin:                   ${margin}%`);
  console.log('');
  console.log('  INCOME BREAKDOWN:');
  console.log('  ─────────────────');
  console.log(`  Full rent payments:              21`);
  console.log(`  Late payments:                   3`);
  console.log(`  Partial payments:                2`);
  console.log(`  Payment methods: cash (6), bank_transfer (14), cheque (4)`);
  console.log('');
  console.log('  EXPENSE BREAKDOWN:');
  console.log('  ─────────────────');
  // Group expenses by category
  const expByCategory = {};
  for (const e of expensesToCreate) {
    expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount;
  }
  for (const [cat, amt] of Object.entries(expByCategory).sort((a, b) => b[1] - a[1])) {
    const catLabel = {
      manpower: 'Manpower/Staff',
      salary: 'Salaries',
      municipality: 'Municipality Fees',
      utility: 'Utilities (Water/Elec/Gas)',
      maintenance: 'Maintenance & Repairs',
      security: 'Security',
      insurance: 'Insurance',
      leasing: 'Leasing Commission',
      other: 'Operational/Other',
    }[cat] || cat;
    console.log(`  ${catLabel.padEnd(30)} AED ${amt.toLocaleString()}`);
  }
  console.log('');
  console.log('  DATASET IS READY FOR VALIDATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
