import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Request } from 'express'

/**
 * Guard JWT compatible GraphQL — protège les resolvers en exigeant un
 * token valide dans le cookie.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context)
    return ctx.getContext<{ req: Request }>().req
  }
}
