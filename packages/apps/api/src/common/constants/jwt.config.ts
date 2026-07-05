/**
 * Configuration JWT centralisée.
 */

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: la variable d\'environnement JWT_SECRET n\'est pas définie. ' +
      'Elle est requise pour la sécurité (secret fort et aléatoire).',
  )
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    `WARNING: JWT_SECRET fait moins de 32 caractères (actuel: ${process.env.JWT_SECRET.length}). ` +
      'Utilisez un secret plus long (64+ recommandé) en production.',
  )
}

export const JWT_CONFIG = {
  /** Secret de signature — obligatoirement via variable d'environnement. */
  secret: process.env.JWT_SECRET,

  /** Durée de vie du token d'accès. */
  expiresIn: '7d',

  /** Durée de vie du refresh token. */
  refreshExpiresIn: '30d',

  /** Nom du cookie contenant le token d'accès. */
  cookieName: 'auth_token',

  /** Nom du cookie contenant le refresh token. */
  refreshCookieName: 'refresh_token',
} as const
