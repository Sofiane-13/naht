import { Field, ObjectType } from '@nestjs/graphql'

/**
 * Représentation GraphQL d'un utilisateur (type de sortie).
 */
@ObjectType('User')
export class UserGraphQl {
  @Field(() => String)
  id!: string

  @Field(() => String)
  email!: string

  @Field(() => String, { nullable: true })
  firstName?: string | null

  @Field(() => String, { description: 'CREATED | BLOCKED' })
  status!: string
}
