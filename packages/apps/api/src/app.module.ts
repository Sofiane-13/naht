import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { ThrottlerModule } from '@nestjs/throttler'
import { join } from 'path'
import type { Request, Response } from 'express'
import { PrismaModule } from './infrastructure/prisma/prisma.module.js'
import { UserModule } from './user/user.module.js'
import { AuthModule } from './auth/auth.module.js'

@Module({
  imports: [
    PrismaModule,
    // Rate limit global : 100 requêtes / minute / IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.graphql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
