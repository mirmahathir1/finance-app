import { execSync } from 'child_process'
import { config as loadEnv } from 'dotenv'
import { PrismaClient } from '@prisma/client'

loadEnv({ path: '.env.local', override: false })
loadEnv()

const prisma = new PrismaClient()

export async function resetDb(): Promise<void> {
  execSync('npx prisma migrate reset --force --skip-generate --skip-seed', {
    stdio: 'inherit',
    env: process.env,
  })
}

export async function countTransactions(): Promise<number> {
  return prisma.transaction.count()
}

async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}

if (require.main === module) {
  const action = process.argv[2]
  const run = async () => {
    if (action === 'reset') {
      await resetDb()
      console.log('Database reset successfully.')
      return
    }
    throw new Error(`Unknown action "${action}". Expected "reset".`)
  }

  run()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => {
      void disconnect()
    })
}

process.on('beforeExit', () => {
  void disconnect()
})

