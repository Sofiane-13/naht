import { User } from '../model/User.js'

/**
 * Port sortant (driven) — abstraction de la persistance des utilisateurs.
 * Implémenté par un adaptateur (Prisma) côté infrastructure.
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<User>
  update(user: User): Promise<User>
}

/** Token d'injection NestJS pour le port. */
export const IUserRepository = Symbol('IUserRepository')
