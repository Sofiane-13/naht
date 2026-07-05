import { Inject, Injectable, Logger } from '@nestjs/common'
import { User } from '../model/User.js'
import { IUserRepository } from '../outboundPorts/IUserRepository.js'

export interface CreatedUserResult {
  userId: string
  isNewUser: boolean
  firstName?: string
}

/**
 * Service applicatif User (port entrant).
 *
 * Sert de token d'injection ET d'implémentation (comme dans diasporteur) :
 * les autres modules injectent `UserService` directement.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email)
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  /**
   * Crée l'utilisateur s'il n'existe pas (première authentification réussie).
   * Idempotent : renvoie l'utilisateur existant sinon.
   */
  async createUserFromEmail(email: string): Promise<CreatedUserResult> {
    const existing = await this.userRepository.findByEmail(email)
    if (existing) {
      return {
        userId: existing.id,
        isNewUser: false,
        firstName: existing.firstName,
      }
    }

    const firstName = User.firstNameFromEmail(email)
    const created = await this.userRepository.create(
      new User({ email, firstName: firstName || undefined }),
    )
    this.logger.log(`Nouvel utilisateur créé : ${email} (${created.id})`)

    return { userId: created.id, isNewUser: true, firstName }
  }
}
