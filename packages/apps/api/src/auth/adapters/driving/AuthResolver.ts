import { Logger } from '@nestjs/common'
import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql'
import { Request, Response } from 'express'
import { AuthService } from '../../domain/AuthService.js'
import {
  JwtPayload,
  JwtTokenService,
} from '../../domain/JwtTokenService.js'
import { AuthResponse, RefreshResponse } from './dto/AuthResponse.js'
import { CurrentUser } from './dto/CurrentUser.js'
import { UserService } from '../../../user/domain/inboundPorts/UserService.js'
import { JWT_CONFIG } from '../../../common/constants/jwt.config.js'
import { InvalidTokenException } from '../../../common/exceptions/index.js'

interface GraphQLContext {
  req: Request
  res: Response
}

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name)

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    accessExpiresIn: number,
    refreshExpiresIn: number,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie(JWT_CONFIG.cookieName, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessExpiresIn * 1000,
      path: '/',
    })
    res.cookie(JWT_CONFIG.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshExpiresIn * 1000,
      path: '/',
    })
  }

  private clearAuthCookies(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production'
    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    }
    res.clearCookie(JWT_CONFIG.cookieName, options)
    res.clearCookie(JWT_CONFIG.refreshCookieName, options)
  }

  @Query(() => CurrentUser, {
    nullable: true,
    description: 'Utilisateur authentifié courant (depuis le cookie)',
  })
  async getCurrentUser(
    @Context() context: GraphQLContext,
  ): Promise<CurrentUser | null> {
    try {
      const token = context.req?.cookies?.[JWT_CONFIG.cookieName]
      if (!token) return null

      const decoded = this.jwtTokenService.validateToken(token, 'access')
      const user = await this.userService.findByEmail(decoded.email)
      if (!user) return null

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
      }
    } catch {
      return null
    }
  }

  @Mutation(() => Boolean, {
    description: 'Envoie un code de vérification par email',
  })
  async sendEmailCode(@Args('email') email: string): Promise<boolean> {
    this.logger.log(`Envoi du code à : ${email}`)
    return this.authService.sendVerificationCode(email)
  }

  @Mutation(() => AuthResponse, {
    description: 'Vérifie le code email et pose les cookies JWT',
  })
  async verifyEmailCode(
    @Args('email') email: string,
    @Args('code') code: string,
    @Context() context: GraphQLContext,
  ): Promise<AuthResponse> {
    const tokenData = await this.authService.verifyCodeAndGenerateToken(
      email,
      code,
    )
    this.setAuthCookies(
      context.res,
      tokenData.accessToken,
      tokenData.refreshToken,
      tokenData.expiresIn,
      tokenData.refreshExpiresIn,
    )
    return {
      accessToken: tokenData.accessToken,
      expiresIn: tokenData.expiresIn,
      email,
    }
  }

  @Mutation(() => Boolean, { description: 'Déconnexion — supprime les cookies' })
  async logout(@Context() context: GraphQLContext): Promise<boolean> {
    this.clearAuthCookies(context.res)
    return true
  }

  @Mutation(() => RefreshResponse, {
    description: 'Rafraîchit le token d\'accès via le refresh token',
  })
  async refreshToken(
    @Context() context: GraphQLContext,
  ): Promise<RefreshResponse> {
    const refreshToken =
      context.req?.cookies?.[JWT_CONFIG.refreshCookieName]
    if (!refreshToken) {
      throw new InvalidTokenException()
    }

    try {
      const payload: JwtPayload =
        this.jwtTokenService.validateRefreshToken(refreshToken)

      const user = await this.userService.findByEmail(payload.email)
      if (!user || user.isBlocked()) {
        throw new InvalidTokenException()
      }

      const newToken = this.jwtTokenService.generateAccessToken(payload.email)
      const isProduction = process.env.NODE_ENV === 'production'
      context.res.cookie(JWT_CONFIG.cookieName, newToken.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: newToken.expiresIn * 1000,
        path: '/',
      })

      return { accessToken: newToken.accessToken, expiresIn: newToken.expiresIn }
    } catch {
      this.clearAuthCookies(context.res)
      throw new InvalidTokenException()
    }
  }
}
