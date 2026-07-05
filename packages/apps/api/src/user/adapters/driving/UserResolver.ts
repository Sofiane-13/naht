import { UseGuards } from '@nestjs/common'
import { Query, Resolver } from '@nestjs/graphql'
import { UserGraphQl } from './User.model.js'
import { UserService } from '../../domain/inboundPorts/UserService.js'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard.js'
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../auth/infrastructure/current-user.decorator.js'
import { NotAuthenticatedException } from '../../../common/exceptions/index.js'

@Resolver(() => UserGraphQl)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  /** Profil complet de l'utilisateur authentifié (route protégée). */
  @UseGuards(JwtAuthGuard)
  @Query(() => UserGraphQl, { description: 'Utilisateur authentifié' })
  async me(@CurrentUser() current: CurrentUserPayload): Promise<UserGraphQl> {
    const user = await this.userService.findByEmail(current.email)
    if (!user) {
      throw new NotAuthenticatedException()
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      status: user.status,
    }
  }
}
