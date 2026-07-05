import { Field, ObjectType, Int } from '@nestjs/graphql'

@ObjectType({ description: 'Réponse après vérification du code email' })
export class AuthResponse {
  @Field(() => String, { description: 'JWT access token' })
  accessToken!: string

  @Field(() => Int, { description: 'Expiration du token (secondes)' })
  expiresIn!: number

  @Field(() => String)
  email!: string
}

@ObjectType({ description: 'Réponse après rafraîchissement du token' })
export class RefreshResponse {
  @Field(() => String)
  accessToken!: string

  @Field(() => Int)
  expiresIn!: number
}
