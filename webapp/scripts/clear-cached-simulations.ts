/**
 * Clear all cached simulation results from the database
 *
 * Run with: npx tsx scripts/clear-cached-simulations.ts
 *
 * This will force all scenarios to be recalculated with the corrected tax brackets.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all cached simulation results...\n')

  try {
    // Clear all cached projectionResults from Scenario table
    const scenarioUpdate = await prisma.scenario.updateMany({
      data: {
        projectionResults: null
      }
    })

    console.log(`✅ Cleared cached results from ${scenarioUpdate.count} scenarios`)

    // Delete all Projection records (they'll be regenerated)
    const projectionDelete = await prisma.projection.deleteMany({})

    console.log(`✅ Deleted ${projectionDelete.count} projection records`)

    console.log('\n🎉 Done! All cached simulation results have been cleared.')
    console.log('   Next time you run a simulation, it will use the corrected tax calculations.')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
