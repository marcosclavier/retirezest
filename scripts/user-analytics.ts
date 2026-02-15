#!/usr/bin/env tsx
/**
 * RetireZest User Analytics Report
 *
 * Generates detailed analytics about user registrations and activity
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
}

async function getUserStats(): Promise<UserStats> {
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
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { updatedAt: { gte: todayStart } } }),
    prisma.user.count({ where: { updatedAt: { gte: weekStart } } }),
  ])

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    activeUsersToday,
    activeUsersThisWeek,
  }
}

async function getRecentUsers(limit: number = 10) {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
}

async function getRegistrationsByDay(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Group by day
  const byDay: Record<string, number> = {}
  users.forEach(user => {
    const day = user.createdAt.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })

  return byDay
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

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('RetireZest User Analytics Report')
  console.log('Generated:', formatDate(new Date()))
  console.log('='.repeat(60) + '\n')

  // Overall Stats
  const stats = await getUserStats()

  console.log('📊 OVERVIEW')
  console.log('-'.repeat(60))
  console.log(`Total Users:              ${stats.totalUsers}`)
  console.log(`New Users Today:          ${stats.newUsersToday}`)
  console.log(`New Users This Week:      ${stats.newUsersThisWeek}`)
  console.log(`New Users This Month:     ${stats.newUsersThisMonth}`)
  console.log(`Active Users Today:       ${stats.activeUsersToday}`)
  console.log(`Active Users This Week:   ${stats.activeUsersThisWeek}`)
  console.log()

  // Recent Users
  const recentUsers = await getRecentUsers(15)
  console.log('👥 RECENT USERS (Last 15 Registrations)')
  console.log('-'.repeat(60))
  recentUsers.forEach((user, index) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'
    const isActive = new Date().getTime() - user.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    const activityIndicator = isActive ? '🟢' : '⚪'

    console.log(`${index + 1}. ${activityIndicator} ${user.email}`)
    console.log(`   Name: ${name}`)
    console.log(`   Registered: ${formatDate(user.createdAt)}`)
    console.log(`   Last Active: ${formatDate(user.updatedAt)}`)
    console.log()
  })

  // Daily Registrations
  const registrationsByDay = await getRegistrationsByDay(30)
  console.log('📈 DAILY REGISTRATIONS (Last 30 Days)')
  console.log('-'.repeat(60))

  const sortedDays = Object.entries(registrationsByDay).sort(([a], [b]) => b.localeCompare(a))

  if (sortedDays.length > 0) {
    sortedDays.forEach(([day, count]) => {
      const bar = '█'.repeat(count)
      console.log(`${day}  ${bar} ${count}`)
    })
  } else {
    console.log('No registrations in the last 30 days')
  }

  console.log()

  // Growth Metrics
  console.log('📊 GROWTH METRICS')
  console.log('-'.repeat(60))

  const weeklyAverage = stats.newUsersThisWeek / 7
  const monthlyAverage = stats.newUsersThisMonth / 30

  console.log(`Average new users per day (7-day):   ${weeklyAverage.toFixed(2)}`)
  console.log(`Average new users per day (30-day):  ${monthlyAverage.toFixed(2)}`)
  console.log(`User retention rate (weekly active): ${((stats.activeUsersThisWeek / stats.totalUsers) * 100).toFixed(1)}%`)

  console.log()
  console.log('='.repeat(60) + '\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
