import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create or update company
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {
      name: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.',
      nameAr: 'الريف الجنوبي للعقارات والصيانة العامة ذ.م.م',
      nameBn: 'আল রিফ আল জুনুবি রিয়েল এস্টেট অ্যান্ড জেনারেল মেইনটেন্যান্স এলএলসি',
      nameUr: 'الریف الجنوبی ریئل اسٹیٹ اینڈ جنرل مینٹیننس لمیٹڈ',
      phone: '+971-2-555-0199',
      email: 'info@alreefjanoubi.ae',
      address: 'Khalifa City A, Abu Dhabi, UAE',
    },
    create: {
      id: 'company-1',
      name: 'Al Reef Al Junoobi Real Estate & General Maintenance L.L.C.',
      nameAr: 'الريف الجنوبي للعقارات والصيانة العامة ذ.م.م',
      nameBn: 'আল রিফ আল জুনুবি রিয়েল এস্টেট অ্যান্ড জেনারেল মেইনটেন্যান্স এলএলসি',
      nameUr: 'الریف الجنوبی ریئل اسٹیٹ اینڈ جنرل مینٹیننس لمیٹڈ',
      phone: '+971-2-555-0199',
      email: 'info@alreefjanoubi.ae',
      address: 'Khalifa City A, Abu Dhabi, UAE',
    },
  })

  console.log('Company created:', company.name)

  // Create default users with strong hashed passwords
  // NOTE: Change these passwords immediately after first login!
  const adminPassword = await bcrypt.hash('AlReef@Admin2024!', 12)
  const ownerPassword = await bcrypt.hash('AlReef@Owner2024!', 12)
  const staffPassword = await bcrypt.hash('AlReef@Staff2024!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alreef.ae' },
    update: {},
    create: {
      email: 'admin@alreef.ae',
      password: adminPassword,
      name: 'Ahmed Mahmoud',
      nameAr: 'أحمد محمود',
      nameBn: 'আহমেদ মাহমুদ',
      nameUr: 'احمد محمود',
      role: 'admin',
      companyId: company.id,
      mustChangePassword: true,
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'owner@alreef.ae' },
    update: {},
    create: {
      email: 'owner@alreef.ae',
      password: ownerPassword,
      name: 'Shafiul Azam',
      nameAr: 'شفيول أعظم',
      nameBn: 'শাফিউল আযম',
      nameUr: 'شفیول اعظم',
      role: 'owner',
      companyId: company.id,
      mustChangePassword: true,
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@alreef.ae' },
    update: {},
    create: {
      email: 'staff@alreef.ae',
      password: staffPassword,
      name: 'Karim Hossain',
      nameAr: 'كريم حسين',
      nameBn: 'করিম হোসেন',
      nameUr: 'کریم حسین',
      role: 'staff',
      companyId: company.id,
      mustChangePassword: true,
    },
  })

  console.log('Users created:', admin.email, owner.email, staff.email)
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
