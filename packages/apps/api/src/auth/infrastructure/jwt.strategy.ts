import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { Request } from 'express'
import { JwtPayload } from '../domain/JwtTokenService.js'
import { JWT_CONFIG } from '../../common/constants/jwt.config.js'
import { IUserRepository } from '../../user/domain/outboundPorts/IUserRepository.js'

/**
 * Stratégie Passport JWT — extrait le token depuis le cookie httpOnly.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.[JWT_CONFIG.cookieName] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.secret,
    })
  }

  async validate(payload: JwtPayload): Promise<{ email: string }> {
    const user = await this.userRepository.findByEmail(payload.email)
    if (user?.isBlocked()) {
      throw new UnauthorizedException('Compte bloqué')
    }
    return { email: payload.email }
  }
}
