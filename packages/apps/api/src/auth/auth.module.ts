import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthResolver } from './adapters/driving/AuthResolver.js'
import { AuthService } from './domain/AuthService.js'
import { JwtTokenService } from './domain/JwtTokenService.js'
import { EmailService } from './infrastructure/EmailService.js'
import { OtpStore } from './infrastructure/OtpStore.js'
import { JwtStrategy } from './infrastructure/jwt.strategy.js'
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard.js'
import { IEmailService } from './domain/ports/IEmailService.js'
import { UserModule } from '../user/user.module.js'
import { JWT_CONFIG } from '../common/constants/jwt.config.js'

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_CONFIG.secret,
      signOptions: { expiresIn: JWT_CONFIG.expiresIn },
    }),
  ],
  providers: [
    AuthResolver,
    AuthService,
    JwtTokenService,
    OtpStore,
    JwtStrategy,
    JwtAuthGuard,
    { provide: IEmailService, useClass: EmailService },
  ],
  exports: [AuthService, JwtTokenService, JwtAuthGuard],
})
export class AuthModule {}
