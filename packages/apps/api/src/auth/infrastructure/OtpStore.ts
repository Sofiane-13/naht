import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'

/**
 * Stockage des codes de vérification (OTP) avec expiration (TTL).
 *
 * Utilise Redis si REDIS_URL est défini, sinon un fallback en mémoire
 * (dev/test uniquement — non partagé entre instances).
 */
@Injectable()
export class OtpStore implements OnModuleDestroy {
  private readonly logger = new Logger(OtpStore.name)
  private readonly redis: Redis | null = null

  /** Fallback mémoire : clé -> { valeur, échéance (ms epoch) }. */
  private readonly memory = new Map<string, { value: string; expiresAt: number }>()

  constructor() {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 1000, 3000)),
      })
      this.redis.on('connect', () => this.logger.log('✅ Redis connecté (OTP)'))
      this.redis.on('error', (e) => this.logger.warn(`Redis error: ${e.message}`))
    } else {
      this.logger.warn(
        'REDIS_URL non défini — stockage OTP en mémoire (dev only).',
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit()
  }

  isUsingRedis(): boolean {
    return this.redis !== null
  }

  private sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key)
    }
  }

  /** Stocke une valeur avec un TTL en secondes. */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttlSeconds)
      return
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) {
      return this.redis.get(key)
    }
    this.sweep()
    return this.memory.get(key)?.value ?? null
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key)
      return
    }
    this.memory.delete(key)
  }

  /**
   * Incrémente un compteur avec fenêtre (TTL). Renvoie la valeur courante.
   * Sert au rate limiting (demandes de code, tentatives).
   */
  async increment(key: string, windowSeconds: number): Promise<number> {
    if (this.redis) {
      const count = await this.redis.incr(key)
      if (count === 1) {
        await this.redis.expire(key, windowSeconds)
      }
      return count
    }
    this.sweep()
    const existing = this.memory.get(key)
    if (!existing) {
      this.memory.set(key, {
        value: '1',
        expiresAt: Date.now() + windowSeconds * 1000,
      })
      return 1
    }
    const next = parseInt(existing.value, 10) + 1
    existing.value = String(next)
    return next
  }
}
