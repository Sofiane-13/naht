import { Injectable, Logger } from '@nestjs/common'
import { IEmailService } from '../domain/ports/IEmailService.js'

/**
 * Implémentation email.
 *
 * En dev/test, le code est simplement loggé dans la console (aucun SMTP
 * requis pour démarrer). Branchez ici un vrai provider (Resend, SES,
 * Nodemailer…) pour la production.
 */
@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name)

  async sendVerificationCode(
    email: string,
    code: string,
    expiryMinutes: number,
  ): Promise<void> {
    // TODO(prod): remplacer par un envoi réel (Resend / SES / Nodemailer).
    this.logger.log(
      `📧 [DEV] Code de vérification pour ${email} : ${code} (valide ${expiryMinutes} min)`,
    )
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    this.logger.log(
      `📧 [DEV] Email de bienvenue pour ${email}${firstName ? ` (${firstName})` : ''}`,
    )
  }
}
