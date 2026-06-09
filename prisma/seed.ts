import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create or update company
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {
      name: 'Real Estate Emperor Property Management L.L.C.',
      nameAr: 'إمبراطور العقارات لإدارة الممتلكات ذ.م.م',
      nameBn: 'রিয়েল এস্টেট এম্পেরর প্রপার্টি ম্যানেজমেন্ট এলএলসি',
      nameUr: 'رییل اسٹیٹ ایمپیرر پراپرٹی مینجمنٹ ایل ایل سی',
      phone: '+971-4-555-0100',
      email: 'info@realestateemperor.ae',
      address: 'Business Bay, Dubai, UAE',
    },
    create: {
      id: 'company-1',
      name: 'Real Estate Emperor Property Management L.L.C.',
      nameAr: 'إمبراطور العقارات لإدارة الممتلكات ذ.م.م',
      nameBn: 'রিয়েল এস্টেট এম্পেরর প্রপার্টি ম্যানেজমেন্ট এলএলসি',
      nameUr: 'رییل اسٹیٹ ایمپیرر پراپرٹی مینجمنٹ ایل ایل سی',
      phone: '+971-4-555-0100',
      email: 'info@realestateemperor.ae',
      address: 'Business Bay, Dubai, UAE',
    },
  })

  console.log('Company created:', company.name)

  // Create default users with strong hashed passwords
  // IMPORTANT: update block ensures re-seeding resets passwords to known values
  // Emails are stored lowercase — auth system lowercases input before lookup
  //   demoO → demoo, demoA → demoa, demoS → demos (case-insensitive login)
  const adminPassword = await bcrypt.hash('Emperor@Admin2024!', 12)
  const ownerPassword = await bcrypt.hash('Emperor@Owner2024!', 12)
  const staffPassword = await bcrypt.hash('Emperor@Staff2024!', 12)
  const accountantPassword = await bcrypt.hash('Emperor@Accountant2024!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestateemperor.ae' },
    update: {
      password: adminPassword,
      name: 'Demo Admin',
      nameAr: 'مدير تجريبي',
      nameBn: 'ডেমো অ্যাডমিন',
      nameUr: 'ڈیمو ایڈمن',
      role: 'admin',
      isActive: true,
      deletedAt: null,
      mustChangePassword: false,
    },
    create: {
      email: 'admin@realestateemperor.ae',
      password: adminPassword,
      name: 'Demo Admin',
      nameAr: 'مدير تجريبي',
      nameBn: 'ডেমো অ্যাডমিন',
      nameUr: 'ڈیمو ایڈمن',
      role: 'admin',
      companyId: company.id,
      mustChangePassword: false,
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'demoo@realestate.ae' },
    update: {
      password: ownerPassword,
      name: 'Demo Owner',
      nameAr: 'مالك تجريبي',
      nameBn: 'ডেমো মালিক',
      nameUr: 'ڈیمو مالک',
      role: 'owner',
      isActive: true,
      deletedAt: null,
      mustChangePassword: false,
    },
    create: {
      email: 'demoo@realestate.ae',
      password: ownerPassword,
      name: 'Demo Owner',
      nameAr: 'مالك تجريبي',
      nameBn: 'ডেমো মালিক',
      nameUr: 'ڈیمو مالک',
      role: 'owner',
      companyId: company.id,
      mustChangePassword: false,
    },
  })

  const accountant = await prisma.user.upsert({
    where: { email: 'demoa@realestate.ae' },
    update: {
      password: accountantPassword,
      name: 'Demo Accountant',
      nameAr: 'محاسب تجريبي',
      nameBn: 'ডেমো হিসাবরক্ষক',
      nameUr: 'ڈیمو اکاؤنٹنٹ',
      role: 'accountant',
      isActive: true,
      deletedAt: null,
      mustChangePassword: false,
    },
    create: {
      email: 'demoa@realestate.ae',
      password: accountantPassword,
      name: 'Demo Accountant',
      nameAr: 'محاسب تجريبي',
      nameBn: 'ডেমো হিসাবরক্ষক',
      nameUr: 'ڈیمو اکاؤنٹنٹ',
      role: 'accountant',
      companyId: company.id,
      mustChangePassword: false,
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'demos@realestate.ae' },
    update: {
      password: staffPassword,
      name: 'Demo Staff',
      nameAr: 'موظف تجريبي',
      nameBn: 'ডেমো স্টাফ',
      nameUr: 'ڈیمو اسٹاف',
      role: 'staff',
      isActive: true,
      deletedAt: null,
      mustChangePassword: false,
    },
    create: {
      email: 'demos@realestate.ae',
      password: staffPassword,
      name: 'Demo Staff',
      nameAr: 'موظف تجريبي',
      nameBn: 'ডেমো স্টাফ',
      nameUr: 'ڈیمو اسٹاف',
      role: 'staff',
      companyId: company.id,
      mustChangePassword: false,
    },
  })

  // Clear any rate limit entries so users aren't locked out after re-seed
  await prisma.rateLimitEntry.deleteMany({}).catch(() => {})
  console.log('Rate limit entries cleared')

  console.log('Users created/updated:', admin.email, owner.email, accountant.email, staff.email)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
