/**
 * @naht/shared — types & constantes partagés entre l'API et le frontend.
 */

/** Statut d'un compte utilisateur. */
export enum UserStatus {
  CREATED = 'CREATED',
  BLOCKED = 'BLOCKED',
}

/**
 * Les axes de développement personnel sur lesquels un utilisateur peut
 * organiser ses challenges. Le cœur métier de naht.
 */
export enum ChallengeAxis {
  SPORT = 'SPORT',
  NUTRITION = 'NUTRITION',
  LECTURE = 'LECTURE',
  FORMATION = 'FORMATION',
  MEDITATION = 'MEDITATION',
  FINANCE = 'FINANCE',
  AUTRE = 'AUTRE',
}

/** Libellés d'affichage (FR) pour chaque axe. */
export const CHALLENGE_AXIS_LABELS: Record<ChallengeAxis, string> = {
  [ChallengeAxis.SPORT]: 'Sport',
  [ChallengeAxis.NUTRITION]: 'Nutrition',
  [ChallengeAxis.LECTURE]: 'Lecture',
  [ChallengeAxis.FORMATION]: 'Se former',
  [ChallengeAxis.MEDITATION]: 'Méditation',
  [ChallengeAxis.FINANCE]: 'Finance',
  [ChallengeAxis.AUTRE]: 'Autre',
}

/** Profil utilisateur exposé côté client après authentification. */
export interface CurrentUser {
  id: string
  email: string
  firstName?: string | null
}
