import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cols = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  )
  console.log('Users columns:', cols.map(c => c.column_name))

  const tables = await prisma.$queryRawUnsafe<Array<{tablename: string}>>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  )
  console.log('Tables:', tables.map(t => t.tablename))
}

main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect())
