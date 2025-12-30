#!/usr/bin/env tsx
/**
 * RetireZest Detailed User Analytics Report
 *
 * Generates comprehensive analytics about user behavior, engagement,
 * and financial profile completion.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DetailedUserStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
  usersWithCompletedProfiles: number
  usersWithAssets: number
  usersWithIncome: number
  usersWithExpenses: number
  usersWithPartners: number
  usersWithRetirementGoals: number
}

interface UserProfileCompletion {
  email: string
  name: string
  registeredAt: Date
  lastActive: Date
  hasPersonalInfo: boolean
  hasPartner: boolean
  hasAssets: boolean
  hasIncome: boolean
  hasExpenses: boolean
  hasRetirementGoals: boolean
  completionPercentage: number
  assetCount: number
  incomeCount: number
  expenseCount: number
  totalAssetValue: number
}

async function getDetailedUserStats(): Promise<DetailedUserStats> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    activeUsersToday,
    activeUsersThisWeek,
    usersWithAssets,
    usersWithIncome,
    usersWithExpenses,
    usersWithPartners,
    usersWithRetirementGoals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { updatedAt: { gte: todayStart } } }),
    prisma.user.count({ where: { updatedAt: { gte: weekStart } } }),
    prisma.user.count({ where: { assets: { some: {} } } }),
    prisma.user.count({ where: { incomeSources: { some: {} } } }),
    prisma.user.count({ where: { expenses: { some: {} } } }),
    prisma.user.count({ where: { includePartner: true } }),
    prisma.user.count({ where: { targetRetirementAge: { not: null } } }),
  ])

  // Calculate completed profiles (users with all key fields)
  const usersWithCompletedProfiles = await prisma.user.count({
    where: {
      AND: [
        { firstName: { not: null } },
        { lastName: { not: null } },
        { dateOfBirth: { not: null } },
        { province: { not: null } },
        { targetRetirementAge: { not: null } },
        { assets: { some: {} } },
        { incomeSources: { some: {} } },
        { expenses: { some: {} } },
      ],
    },
  })

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    activeUsersToday,
    activeUsersThisWeek,
    usersWithCompletedProfiles,
    usersWithAssets,
    usersWithIncome,
    usersWithExpenses,
    usersWithPartners,
    usersWithRetirementGoals,
  }
}

async function getUserProfileCompletions(): Promise<UserProfileCompletion[]> {
  const users = await prisma.user.findMany({
    include: {
      assets: true,
      incomeSources: true,
      expenses: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return users.map((user) => {
    const hasPersonalInfo = !!(user.firstName && user.lastName && user.dateOfBirth && user.province)
    const hasPartner = user.includePartner || false
    const hasAssets = user.assets.length > 0
    const hasIncome = user.incomeSources.length > 0
    const hasExpenses = user.expenses.length > 0
    const hasRetirementGoals = !!(user.targetRetirementAge && user.lifeExpectancy)

    // Calculate completion percentage
    const completionFields = [
      hasPersonalInfo,
      hasAssets,
      hasIncome,
      hasExpenses,
      hasRetirementGoals,
    ]
    const completionPercentage = (completionFields.filter(Boolean).length / completionFields.length) * 100

    // Calculate total asset value
    const totalAssetValue = user.assets.reduce((sum, asset) => sum + asset.balance, 0)

    return {
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name',
      registeredAt: user.createdAt,
      lastActive: user.updatedAt,
      hasPersonalInfo,
      hasPartner,
      hasAssets,
      hasIncome,
      hasExpenses,
      hasRetirementGoals,
      completionPercentage: Math.round(completionPercentage),
      assetCount: user.assets.length,
      incomeCount: user.incomeSources.length,
      expenseCount: user.expenses.length,
      totalAssetValue,
    }
  })
}

async function getAssetDistribution() {
  const assets = await prisma.asset.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
    _sum: {
      balance: true,
    },
  })

  return assets.map((asset) => ({
    type: asset.type.toUpperCase(),
    count: asset._count.id,
    totalValue: asset._sum.balance || 0,
  }))
}

async function getIncomeDistribution() {
  const incomes = await prisma.income.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  })

  return incomes.map((income) => ({
    type: income.type.charAt(0).toUpperCase() + income.type.slice(1),
    count: income._count.id,
    totalAmount: income._sum.amount || 0,
  }))
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function main() {
  console.log('\n' + '═'.repeat(70))
  console.log('RetireZest Detailed User Analytics Report')
  console.log('Generated:', formatDate(new Date()))
  console.log('═'.repeat(70) + '\n')

  // Overall Stats
  const stats = await getDetailedUserStats()

  console.log('📊 USER OVERVIEW')
  console.log('─'.repeat(70))
  console.log(`Total Users:                    ${stats.totalUsers}`)
  console.log(`New Users Today:                ${stats.newUsersToday}`)
  console.log(`New Users This Week:            ${stats.newUsersThisWeek}`)
  console.log(`New Users This Month:           ${stats.newUsersThisMonth}`)
  console.log(`Active Users Today:             ${stats.activeUsersToday}`)
  console.log(`Active Users This Week:         ${stats.activeUsersThisWeek}`)
  console.log()

  console.log('🎯 PROFILE COMPLETION METRICS')
  console.log('─'.repeat(70))
  console.log(`Users with Completed Profiles:  ${stats.usersWithCompletedProfiles} (${((stats.usersWithCompletedProfiles / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log(`Users with Assets:              ${stats.usersWithAssets} (${((stats.usersWithAssets / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log(`Users with Income Sources:      ${stats.usersWithIncome} (${((stats.usersWithIncome / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log(`Users with Expenses:            ${stats.usersWithExpenses} (${((stats.usersWithExpenses / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log(`Users with Retirement Goals:    ${stats.usersWithRetirementGoals} (${((stats.usersWithRetirementGoals / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log(`Users with Partners:            ${stats.usersWithPartners} (${((stats.usersWithPartners / stats.totalUsers) * 100).toFixed(1)}%)`)
  console.log()

  // Profile Completions
  const profileCompletions = await getUserProfileCompletions()

  console.log('👤 USER PROFILE COMPLETION STATUS')
  console.log('─'.repeat(70))

  profileCompletions.forEach((user, index) => {
    const isActive = new Date().getTime() - user.lastActive.getTime() < 7 * 24 * 60 * 60 * 1000
    const activityIndicator = isActive ? '🟢' : '⚪'
    const completionBar = '█'.repeat(Math.floor(user.completionPercentage / 10))

    console.log(`${index + 1}. ${activityIndicator} ${user.name} (${user.email})`)
    console.log(`   Profile Completion: [${completionBar.padEnd(10, '░')}] ${user.completionPercentage}%`)
    console.log(`   Personal Info: ${user.hasPersonalInfo ? '✅' : '❌'} | Assets: ${user.hasAssets ? '✅' : '❌'} (${user.assetCount}) | Income: ${user.hasIncome ? '✅' : '❌'} (${user.incomeCount}) | Expenses: ${user.hasExpenses ? '✅' : '❌'} (${user.expenseCount})`)
    console.log(`   Retirement Goals: ${user.hasRetirementGoals ? '✅' : '❌'} | Partner: ${user.hasPartner ? '✅' : '❌'}`)
    if (user.totalAssetValue > 0) {
      console.log(`   Total Assets: ${formatCurrency(user.totalAssetValue)}`)
    }
    console.log(`   Registered: ${formatDate(user.registeredAt)} | Last Active: ${formatDate(user.lastActive)}`)
    console.log()
  })

  // Asset Distribution
  const assetDistribution = await getAssetDistribution()
  console.log('💰 ASSET DISTRIBUTION')
  console.log('─'.repeat(70))
  if (assetDistribution.length > 0) {
    assetDistribution.forEach((asset) => {
      console.log(`${asset.type.padEnd(15)} ${asset.count.toString().padStart(3)} accounts | Total: ${formatCurrency(asset.totalValue)}`)
    })
    const totalAssets = assetDistribution.reduce((sum, a) => sum + a.totalValue, 0)
    console.log(`${'TOTAL'.padEnd(15)} ${assetDistribution.reduce((sum, a) => sum + a.count, 0).toString().padStart(3)} accounts | Total: ${formatCurrency(totalAssets)}`)
  } else {
    console.log('No assets recorded yet')
  }
  console.log()

  // Income Distribution
  const incomeDistribution = await getIncomeDistribution()
  console.log('💵 INCOME DISTRIBUTION')
  console.log('─'.repeat(70))
  if (incomeDistribution.length > 0) {
    incomeDistribution.forEach((income) => {
      console.log(`${income.type.padEnd(15)} ${income.count.toString().padStart(3)} sources | Total Annual: ${formatCurrency(income.totalAmount)}`)
    })
    const totalIncome = incomeDistribution.reduce((sum, i) => sum + i.totalAmount, 0)
    console.log(`${'TOTAL'.padEnd(15)} ${incomeDistribution.reduce((sum, i) => sum + i.count, 0).toString().padStart(3)} sources | Total Annual: ${formatCurrency(totalIncome)}`)
  } else {
    console.log('No income sources recorded yet')
  }
  console.log()

  // Engagement Funnel
  console.log('📈 USER ENGAGEMENT FUNNEL')
  console.log('─'.repeat(70))
  const funnelSteps = [
    { name: 'Registered', count: stats.totalUsers, percentage: 100 },
    { name: 'Added Personal Info', count: profileCompletions.filter(u => u.hasPersonalInfo).length, percentage: 0 },
    { name: 'Added Assets', count: stats.usersWithAssets, percentage: 0 },
    { name: 'Added Income', count: stats.usersWithIncome, percentage: 0 },
    { name: 'Added Expenses', count: stats.usersWithExpenses, percentage: 0 },
    { name: 'Set Retirement Goals', count: stats.usersWithRetirementGoals, percentage: 0 },
    { name: 'Completed Profile', count: stats.usersWithCompletedProfiles, percentage: 0 },
  ]

  funnelSteps.forEach((step, index) => {
    if (index > 0) {
      step.percentage = (step.count / stats.totalUsers) * 100
    }
    const bar = '█'.repeat(Math.floor(step.percentage / 2))
    console.log(`${step.name.padEnd(25)} ${step.count.toString().padStart(3)} users [${bar.padEnd(50, '░')}] ${step.percentage.toFixed(1)}%`)
  })
  console.log()

  // Conversion Rates
  console.log('🎯 CONVERSION METRICS')
  console.log('─'.repeat(70))
  const registrationToProfile = (stats.usersWithCompletedProfiles / stats.totalUsers) * 100
  const registrationToAssets = (stats.usersWithAssets / stats.totalUsers) * 100
  const assetsToComplete = stats.usersWithAssets > 0 ? (stats.usersWithCompletedProfiles / stats.usersWithAssets) * 100 : 0

  console.log(`Registration → Completed Profile:   ${registrationToProfile.toFixed(1)}%`)
  console.log(`Registration → Added Assets:        ${registrationToAssets.toFixed(1)}%`)
  console.log(`Added Assets → Completed Profile:   ${assetsToComplete.toFixed(1)}%`)
  console.log(`Weekly Retention Rate:              ${((stats.activeUsersThisWeek / stats.totalUsers) * 100).toFixed(1)}%`)
  console.log()

  console.log('═'.repeat(70) + '\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
