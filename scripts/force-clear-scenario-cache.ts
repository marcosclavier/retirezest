/**
 * Force clear scenario cache by directly updating the database
 * This script runs in the Next.js environment which has DATABASE_URL configured
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearCache() {
  console.log('🧹 Clearing scenario cache...\n')

  try {
    // Update all scenarios to set projectionResults to null
    const result = await prisma.scenario.updateMany({
      data: {
        projectionResults: null,
      },
    })

    console.log(`✅ Cleared cache for ${result.count} scenarios`)
    console.log('   Next simulation will use the corrected calculation\n')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearCache()
  .then(() => {
    console.log('✅ Done! Please refresh your browser and run the simulation again.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to clear cache:', error)
    process.exit(1)
  })
