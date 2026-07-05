import { Module } from '@nestjs/common'
import { UserService } from './domain/inboundPorts/UserService.js'
import { IUserRepository } from './domain/outboundPorts/IUserRepository.js'
import { UserPrisma } from './adapters/driven/UserPrisma.js'
import { UserResolver } from './adapters/driving/UserResolver.js'

@Module({
  providers: [
    UserService,
    UserResolver,
    { provide: IUserRepository, useClass: UserPrisma },
  ],
  exports: [UserService, IUserRepository],
})
export class UserModule {}
