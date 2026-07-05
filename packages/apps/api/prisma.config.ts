import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Utilisée par Prisma Migrate. Le runtime utilise l'adapter pg (PrismaService).
    url: env('DIRECT_URL'),
  },
})
