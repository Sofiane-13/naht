import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InvalidTokenException } from '../../common/exceptions/index.js'

export interface JwtPayload {
  email: string
  type?: 'access' | 'refresh'
  iat?: number
  exp?: number
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
  email: string
}

/**
 * Génère et valide les tokens JWT (access + refresh).
 */
@Injectable()
export class JwtTokenService {
  private readonly ACCESS_TOKEN_EXPIRY = '7d'
  private readonly ACCESS_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60
  private readonly REFRESH_TOKEN_EXPIRY = '30d'
  private readonly REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60

  constructor(private readonly jwtService: JwtService) {}

  generateToken(email: string): AuthToken {
    const accessToken = this.jwtService.sign(
      { email, type: 'access' } satisfies JwtPayload,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY },
    )
    const refreshToken = this.jwtService.sign(
      { email, type: 'refresh' } satisfies JwtPayload,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    )
    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY_SECONDS,
      email,
    }
  }

  generateAccessToken(email: string): { accessToken: string; expiresIn: number } {
    const accessToken = this.jwtService.sign(
      { email, type: 'access' } satisfies JwtPayload,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY },
    )
    return { accessToken, expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS }
  }

  validateToken(token: string, expectedType?: 'access' | 'refresh'): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token)
      if (expectedType && payload.type !== expectedType) {
        throw new InvalidTokenException()
      }
      return payload
    } catch {
      throw new InvalidTokenException()
    }
  }

  validateRefreshToken(refreshToken: string): JwtPayload {
    return this.validateToken(refreshToken, 'refresh')
  }
}
