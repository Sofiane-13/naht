/**
 * Port sortant — envoi d'emails transactionnels.
 */
export interface IEmailService {
  sendVerificationCode(
    email: string,
    code: string,
    expiryMinutes: number,
  ): Promise<void>

  sendWelcomeEmail(email: string, firstName?: string): Promise<void>
}

export const IEmailService = Symbol('IEmailService')
