import { randomUUID } from 'crypto'
import { InvalidEmailFormatException } from '../../../common/exceptions/index.js'

export enum UserStatus {
  CREATED = 'CREATED',
  BLOCKED = 'BLOCKED',
}

export interface CreateUser {
  id?: string
  email: string
  firstName?: string
  status?: UserStatus
  createdAt?: Date
}

/**
 * Entité métier User (indépendante de Prisma / GraphQL).
 */
export class User {
  id: string
  email: string
  firstName?: string
  status: UserStatus
  createdAt: Date

  constructor(input: CreateUser) {
    this.id = input.id ?? randomUUID()
    this.email = input.email
    this.firstName = input.firstName
    this.status = input.status ?? UserStatus.CREATED
    this.createdAt = input.createdAt ?? new Date()
  }

  isBlocked(): boolean {
    return this.status === UserStatus.BLOCKED
  }

  /** RG09 — valide le format d'un email. */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      throw new InvalidEmailFormatException()
    }
  }

  /** Dérive un prénom par défaut depuis la partie locale de l'email. */
  static firstNameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? ''
    const cleaned = local.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return ''
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
}
