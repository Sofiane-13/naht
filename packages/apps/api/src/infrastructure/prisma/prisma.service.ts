import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

/**
 * Service Prisma partagé.
 *
 * Utilise l'adapter driver `@prisma/adapter-pg` (Prisma 7) pour se connecter
 * au PostgreSQL Supabase via la chaîne DATABASE_URL.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('FATAL: DATABASE_URL non défini.')
    }
    super({ adapter: new PrismaPg({ connectionString }) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log('✅ Connecté à PostgreSQL (Supabase)')
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
