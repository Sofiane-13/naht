import { Inject, Injectable, Logger } from '@nestjs/common'
import { randomInt } from 'crypto'
import { OtpStore } from '../infrastructure/OtpStore.js'
import { JwtTokenService, AuthToken } from './JwtTokenService.js'
import { IEmailService } from './ports/IEmailService.js'
import { UserService } from '../../user/domain/inboundPorts/UserService.js'
import { IUserRepository } from '../../user/domain/outboundPorts/IUserRepository.js'
import { User } from '../../user/domain/model/User.js'
import {
  VerificationCodeNotFoundException,
  TooManyAttemptsException,
  InvalidVerificationCodeException,
  EmailSendFailedException,
  UserBlockedException,
  InvalidCodeFormatException,
  EmailCodeRateLimitException,
} from '../../common/exceptions/index.js'

/**
 * Authentification passwordless par code OTP (6 chiffres) envoyé par email.
 *
 * - Code à 6 chiffres, valable 10 minutes (TTL du store)
 * - Max 3 tentatives par code
 * - Rate limit : 10 demandes de code / heure / email
 * - À la première vérification réussie, l'utilisateur est créé (signup),
 *   sinon il est simplement connecté (signin) — un seul parcours.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  private readonly MAX_ATTEMPTS = 3
  private readonly CODE_EXPIRY_MINUTES = 10
  private readonly CODE_EXPIRY_SECONDS = this.CODE_EXPIRY_MINUTES * 60
  private readonly MAX_CODE_REQUESTS_PER_HOUR = 10
  private readonly CODE_REQUEST_WINDOW_SECONDS = 3600

  constructor(
    @Inject(IEmailService)
    private readonly emailService: IEmailService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly otpStore: OtpStore,
    private readonly userService: UserService,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Génère et envoie un code de vérification à l'email fourni.
   */
  async sendVerificationCode(email: string): Promise<boolean> {
    User.validateEmail(email)

    // Rate limit : 10 demandes / heure / email
    const rateKey = `otp:reqcount:${email}`
    const count = await this.otpStore.increment(
      rateKey,
      this.CODE_REQUEST_WINDOW_SECONDS,
    )
    if (count > this.MAX_CODE_REQUESTS_PER_HOUR) {
      this.logger.warn(`Rate limit dépassé pour ${email} (${count} demandes)`)
      throw new EmailCodeRateLimitException(this.CODE_REQUEST_WINDOW_SECONDS)
    }

    // Refuser un compte bloqué avant l'envoi
    const existing = await this.userRepository.findByEmail(email)
    if (existing?.isBlocked()) {
      throw new UserBlockedException(email)
    }

    const code = this.generateVerificationCode()
    const codeKey = `otp:code:${email}`
    const attemptsKey = `otp:attempts:${email}`

    try {
      await this.otpStore.set(codeKey, code, this.CODE_EXPIRY_SECONDS)
      await this.otpStore.delete(attemptsKey)
      await this.emailService.sendVerificationCode(
        email,
        code,
        this.CODE_EXPIRY_MINUTES,
      )
      return true
    } catch (error) {
      await this.otpStore.delete(codeKey)
      await this.otpStore.delete(attemptsKey)
      throw new EmailSendFailedException(
        email,
        error instanceof Error ? error : undefined,
      )
    }
  }

  /**
   * Vérifie le code et renvoie un token JWT. Crée l'utilisateur au premier login.
   */
  async verifyCodeAndGenerateToken(
    email: string,
    code: string,
  ): Promise<AuthToken> {
    this.validateCodeFormat(code)

    const codeKey = `otp:code:${email}`
    const attemptsKey = `otp:attempts:${email}`

    const storedCode = await this.otpStore.get(codeKey)
    if (!storedCode) {
      throw new VerificationCodeNotFoundException(email)
    }

    const attempts = await this.otpStore.increment(
      attemptsKey,
      this.CODE_EXPIRY_SECONDS,
    )
    if (attempts > this.MAX_ATTEMPTS) {
      await this.otpStore.delete(codeKey)
      await this.otpStore.delete(attemptsKey)
      throw new TooManyAttemptsException(this.MAX_ATTEMPTS)
    }

    if (storedCode !== code) {
      throw new InvalidVerificationCodeException()
    }

    // Code valide — nettoyage
    await this.otpStore.delete(codeKey)
    await this.otpStore.delete(attemptsKey)

    // Création (signup) ou récupération (signin) de l'utilisateur
    const { userId, isNewUser, firstName } =
      await this.userService.createUserFromEmail(email)
    this.logger.log(
      `Auth OK pour ${email} (id: ${userId}, nouveau: ${isNewUser})`,
    )

    if (isNewUser) {
      this.emailService
        .sendWelcomeEmail(email, firstName)
        .catch((err) => this.logger.error('Envoi email de bienvenue échoué', err))
    }

    // Sécurité : re-vérifier le blocage entre demande et vérification
    const user = await this.userRepository.findByEmail(email)
    if (user?.isBlocked()) {
      throw new InvalidVerificationCodeException() // ne pas révéler le blocage
    }

    return this.jwtTokenService.generateToken(email)
  }

  private validateCodeFormat(code: string): void {
    if (!code || !/^\d{6}$/.test(code)) {
      throw new InvalidCodeFormatException()
    }
  }

  /**
   * Génère un code à 6 chiffres. En dev/test, code fixe pour faciliter les tests.
   */
  private generateVerificationCode(): string {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      return '123456'
    }
    return randomInt(100000, 1000000).toString()
  }
}
