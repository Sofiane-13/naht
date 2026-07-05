import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Request } from 'express'
import { NotAuthenticatedException } from '../../common/exceptions/index.js'

export interface CurrentUserPayload {
  email: string
}

/**
 * Récupère l'utilisateur authentifié depuis le contexte GraphQL.
 * Usage : `@CurrentUser() user: CurrentUserPayload`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload => {
    const ctx = GqlExecutionContext.create(context)
    const req = ctx.getContext<{ req: Request & { user?: CurrentUserPayload } }>()
      .req
    const user = req?.user
    if (!user) {
      throw new NotAuthenticatedException()
    }
    return user
  },
)
