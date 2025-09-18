import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create cashier user
  const cashier = await prisma.user.upsert({
    where: { id: 'cashier-user-id' },
    update: {},
    create: {
      id: 'cashier-user-id',
      pin: process.env.CASHIER_PIN || '1234',
      role: UserRole.CASHIER,
    },
  })

  // Create sample offices
  const offices = await Promise.all([
    prisma.office.upsert({
      where: { id: 'office-1' },
      update: {},
      create: {
        id: 'office-1',
        officeNumber: 'A001',
        name: 'Private Office A',
        description: 'Spacious private office with window view',
        capacity: 2,
        pricePerHour: 15.00,
        pricePerDay: 100.00,
        pricePerWeek: 600.00,
        pricePerMonth: 2000.00,
      },
    }),
    prisma.office.upsert({
      where: { id: 'office-2' },
      update: {},
      create: {
        id: 'office-2',
        officeNumber: 'B001',
        name: 'Meeting Room B',
        description: 'Conference room with projector and whiteboard',
        capacity: 8,
        pricePerHour: 25.00,
        pricePerDay: 180.00,
        pricePerWeek: 1000.00,
        pricePerMonth: 3500.00,
      },
    }),
    prisma.office.upsert({
      where: { id: 'office-3' },
      update: {},
      create: {
        id: 'office-3',
        officeNumber: 'C001',
        name: 'Hot Desk C',
        description: 'Flexible workspace in open area',
        capacity: 1,
        pricePerHour: 8.00,
        pricePerDay: 50.00,
        pricePerWeek: 300.00,
        pricePerMonth: 1000.00,
      },
    }),
  ])

  // Create sample loyalty rewards
  const rewards = await Promise.all([
    // Physical rewards (need QR code and cashier confirmation)
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-1' },
      update: {},
      create: {
        id: 'reward-1',
        name: 'قهوة مجانية',
        description: 'قهوة مجانية من الكافيه',
        pointsCost: 50,
        type: 'PHYSICAL',
      },
    }),
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-2' },
      update: {},
      create: {
        id: 'reward-2',
        name: 'وجبة خفيفة',
        description: 'وجبة خفيفة من المطعم',
        pointsCost: 100,
        type: 'PHYSICAL',
      },
    }),
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-3' },
      update: {},
      create: {
        id: 'reward-3',
        name: 'مشروب بارد',
        description: 'مشروب بارد من الكافيه',
        pointsCost: 75,
        type: 'PHYSICAL',
      },
    }),
    // Time extension rewards (added directly to subscription)
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-4' },
      update: {},
      create: {
        id: 'reward-4',
        name: 'إضافة ساعة',
        description: 'إضافة ساعة واحدة لاشتراكك الحالي',
        pointsCost: 150,
        type: 'TIME_EXTENSION',
        timeValue: 1,
        timeUnit: 'HOURS',
      },
    }),
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-5' },
      update: {},
      create: {
        id: 'reward-5',
        name: 'إضافة يوم',
        description: 'إضافة يوم واحد لاشتراكك الحالي',
        pointsCost: 300,
        type: 'TIME_EXTENSION',
        timeValue: 1,
        timeUnit: 'DAYS',
      },
    }),
    prisma.loyaltyReward.upsert({
      where: { id: 'reward-6' },
      update: {},
      create: {
        id: 'reward-6',
        name: 'إضافة 3 ساعات',
        description: 'إضافة 3 ساعات لاشتراكك الحالي',
        pointsCost: 400,
        type: 'TIME_EXTENSION',
        timeValue: 3,
        timeUnit: 'HOURS',
      },
    }),
  ])

  // Create points configuration
  const pointsConfigs = await Promise.all([
    prisma.pointsConfig.upsert({
      where: { action: 'HOURLY_BOOKING' },
      update: {},
      create: {
        action: 'HOURLY_BOOKING',
        points: 10,
        description: 'نقاط حجز باقة الساعة',
      },
    }),
    prisma.pointsConfig.upsert({
      where: { action: 'DAILY_BOOKING' },
      update: {},
      create: {
        action: 'DAILY_BOOKING',
        points: 500,
        description: 'نقاط حجز باقة اليوم',
      },
    }),
    prisma.pointsConfig.upsert({
      where: { action: 'MONTHLY_BOOKING' },
      update: {},
      create: {
        action: 'MONTHLY_BOOKING',
        points: 1000,
        description: 'نقاط حجز باقة الشهر',
      },
    }),
    prisma.pointsConfig.upsert({
      where: { action: 'HOURLY_RENEWAL' },
      update: {},
      create: {
        action: 'HOURLY_RENEWAL',
        points: 100,
        description: 'نقاط تجديد باقة الساعة',
      },
    }),
    prisma.pointsConfig.upsert({
      where: { action: 'DAILY_RENEWAL' },
      update: {},
      create: {
        action: 'DAILY_RENEWAL',
        points: 300,
        description: 'نقاط تجديد باقة اليوم',
      },
    }),
    prisma.pointsConfig.upsert({
      where: { action: 'MONTHLY_RENEWAL' },
      update: {},
      create: {
        action: 'MONTHLY_RENEWAL',
        points: 800,
        description: 'نقاط تجديد باقة الشهر',
      },
    }),
  ])

  // Create a sample client for testing
  const sampleClient = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      phone: '+1234567890',
      role: UserRole.CLIENT,
      loyaltyPoints: 150,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin: ${admin.username}`)
  console.log(`💳 Cashier PIN: ${cashier.pin}`)
  console.log(`🏢 Created ${offices.length} offices`)
  console.log(`🎁 Created ${rewards.length} loyalty rewards`)
  console.log(`⚙️ Created ${pointsConfigs.length} points configurations`)
  console.log(`📱 Sample client: ${sampleClient.phone}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
