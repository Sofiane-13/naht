import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js'
import { IUserRepository } from '../../domain/outboundPorts/IUserRepository.js'
import { User, UserStatus } from '../../domain/model/User.js'

interface PrismaUserRow {
  id: string
  email: string
  firstName: string | null
  status: string
  createdAt: Date
}

/**
 * Adaptateur Prisma du port IUserRepository.
 */
@Injectable()
export class UserPrisma implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaUserRow): User {
    return new User({
      id: row.id,
      email: row.email,
      firstName: row.firstName ?? undefined,
      status: row.status as UserStatus,
      createdAt: row.createdAt,
    })
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } })
    return row ? this.toDomain(row) : null
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        status: user.status,
      },
    })
    return this.toDomain(row)
  }

  async update(user: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        firstName: user.firstName ?? null,
        status: user.status,
      },
    })
    return this.toDomain(row)
  }
}
