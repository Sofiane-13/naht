import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType({ description: 'Utilisateur courant (depuis le cookie)' })
export class CurrentUser {
  @Field(() => String)
  id!: string

  @Field(() => String)
  email!: string

  @Field(() => String, { nullable: true })
  firstName?: string | null
}
