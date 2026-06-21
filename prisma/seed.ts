import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create or update company
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {
      name: 'Real Estate Emperor - Property Management & Investment',
      nameAr: 'الإمبراطور العقاري - إدارة الممتلكات والاستثمار',
      nameBn: 'রিয়েল এস্টেট এম্পারর - প্রপার্টি ম্যানেজমেন্ট ও ইনভেস্টমেন্ট',
      nameUr: 'ریل اسٹیٹ ایمپیرر - پراپرٹی مینجمنٹ اور انویسٹمنٹ',
      phone: '+971504225590',
      email: 'info@realestateemperor.ae',
      address: "Business Bay, Dubai, UAE",
    },
    create: {
      id: 'company-1',
      name: 'Real Estate Emperor - Property Management & Investment',
      nameAr: 'الإمبراطور العقاري - إدارة الممتلكات والاستثمار',
      nameBn: 'রিয়েল এস্টেট এম্পারর - প্রপার্টি ম্যানেজমেন্ট ও ইনভেস্টমেন্ট',
      nameUr: 'ریل اسٹیٹ ایمپیرر - پراپرٹی مینجمنٹ اور انویسٹمنٹ',
      phone: '+971504225590',
      email: 'info@realestateemperor.ae',
      address: "Business Bay, Dubai, UAE",
    },
  })

  console.log('Company created:', company.name)

  // Create default users with the standard password: Alreef@2025
  // All accounts use the same password for consistency
  const standardPassword = await bcrypt.hash('Alreef@2025', 12)

  const owner = await prisma.user.upsert({
    where: { email: 'demoO@realestate.ae' },
    update: {
      // Always update the password to ensure it matches the expected value
      password: standardPassword,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'demoO@realestate.ae',
      password: standardPassword,
      name: 'Shafiul Azam',
      nameAr: 'شفيول أعظم',
      nameBn: 'শাফিউল আযম',
      nameUr: 'شفیول اعظم',
      role: 'owner',
      companyId: company.id,
      mustChangePassword: false,
      isActive: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestateemperor.ae' },
    update: {
      password: standardPassword,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'admin@realestateemperor.ae',
      password: standardPassword,
      name: 'Ahmed Mahmoud',
      nameAr: 'أحمد محمود',
      nameBn: 'আহমেদ মাহমুদ',
      nameUr: 'احمد محمود',
      role: 'admin',
      companyId: company.id,
      mustChangePassword: false,
      isActive: true,
    },
  })

  const accountant = await prisma.user.upsert({
    where: { email: 'demoA@realestate.ae' },
    update: {
      password: standardPassword,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'demoA@realestate.ae',
      password: standardPassword,
      name: 'Accountant User',
      nameAr: 'محاسب',
      nameBn: 'হিসাবরক্ষক',
      nameUr: 'اکاؤنٹنٹ',
      role: 'accountant',
      companyId: company.id,
      mustChangePassword: false,
      isActive: true,
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'demoS@realestate.ae' },
    update: {
      password: standardPassword,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'demoS@realestate.ae',
      password: standardPassword,
      name: 'Karim Hossain',
      nameAr: 'كريم حسين',
      nameBn: 'করিম হোসেন',
      nameUr: 'کریم حسین',
      role: 'staff',
      companyId: company.id,
      mustChangePassword: false,
      isActive: true,
    },
  })

  console.log('Users created/verified:', owner.email, admin.email, accountant.email, staff.email)

  // Clear any stale rate limit entries (cleanup from previous failed attempts)
  const deletedEntries = await prisma.rateLimitEntry.deleteMany({
    where: {
      identifier: {
        in: [
          'demoO@realestate.ae',
          'admin@realestateemperor.ae',
          'demoA@realestate.ae',
          'demoS@realestate.ae',
        ],
      },
    },
  })
  if (deletedEntries.count > 0) {
    console.log(`Cleared ${deletedEntries.count} stale rate limit entries`)
  }

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
