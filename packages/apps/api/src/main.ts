import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const isProduction = process.env.NODE_ENV === 'production'

  app.use(cookieParser())
  app.use(
    helmet({
      // Autorise le playground GraphQL en dev
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  )

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  const port = parseInt(process.env.PORT ?? '4000', 10)
  await app.listen(port)
  new Logger('Bootstrap').log(
    `🚀 API prête sur http://localhost:${port}/graphql`,
  )
}

void bootstrap()
