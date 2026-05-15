import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  const migrationsDir = join(process.cwd(), 'migrations')
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  console.log(`Found ${files.length} migration files`)

  for (const file of files) {
    console.log(`Running: ${file}...`)
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')

    try {
      await prisma.$executeRawUnsafe(sql)
      console.log(`  ✅ Done`)
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.code === '42710' || e.code === '42P07') {
        console.log(`  ⚠️  Skipped (already exists)`)
      } else {
        console.error(`  ❌ Error: ${e.message?.slice(0, 200)}`)
      }
    }
  }

  console.log('\n🎉 All migrations applied!')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
