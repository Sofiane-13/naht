import { HttpException, HttpStatus } from '@nestjs/common'

/** Format d'email invalide (RG09). */
export class InvalidEmailFormatException extends HttpException {
  constructor() {
    super('Format d\'email invalide.', HttpStatus.BAD_REQUEST)
  }
}

/** Le code n'a pas le bon format (6 chiffres). */
export class InvalidCodeFormatException extends HttpException {
  constructor() {
    super('Le code doit contenir exactement 6 chiffres.', HttpStatus.BAD_REQUEST)
  }
}

/** Aucun code de vérification trouvé pour cet email (jamais envoyé ou expiré). */
export class VerificationCodeNotFoundException extends HttpException {
  constructor(email: string) {
    super(
      `Aucun code valide pour ${email}. Demandez un nouveau code.`,
      HttpStatus.BAD_REQUEST,
    )
  }
}

/** Le code fourni ne correspond pas. */
export class InvalidVerificationCodeException extends HttpException {
  constructor() {
    super('Code de vérification invalide.', HttpStatus.BAD_REQUEST)
  }
}

/** Trop de tentatives sur un même code. */
export class TooManyAttemptsException extends HttpException {
  constructor(maxAttempts: number) {
    super(
      `Trop de tentatives (max ${maxAttempts}). Demandez un nouveau code.`,
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }
}

/** Trop de demandes de code (rate limit). */
export class EmailCodeRateLimitException extends HttpException {
  constructor(retryAfterSeconds: number) {
    super(
      `Trop de demandes de code. Réessayez dans ${retryAfterSeconds}s.`,
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }
}

/** Envoi de l'email échoué. */
export class EmailSendFailedException extends HttpException {
  constructor(email: string, cause?: Error) {
    super(
      `Échec de l'envoi du code à ${email}.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { cause },
    )
  }
}

/** Compte utilisateur bloqué. */
export class UserBlockedException extends HttpException {
  constructor(email: string) {
    super(`Le compte ${email} est bloqué.`, HttpStatus.FORBIDDEN)
  }
}

/** Token invalide ou expiré. */
export class InvalidTokenException extends HttpException {
  constructor() {
    super('Token invalide ou expiré.', HttpStatus.UNAUTHORIZED)
  }
}

/** Requête non authentifiée. */
export class NotAuthenticatedException extends HttpException {
  constructor() {
    super('Authentification requise.', HttpStatus.UNAUTHORIZED)
  }
}
