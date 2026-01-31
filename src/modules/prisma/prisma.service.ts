import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { PrismaClient } from '@/prisma/generated/client'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name)
	private pool: Pool

	constructor(private readonly configService: ConfigService) {
		const connectionString = configService.getOrThrow<string>('database.url')

		const pool = new Pool({
			connectionString,
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		})
		const adapter = new PrismaPg(pool)
		super({
			adapter,
			log:
				configService.getOrThrow<string>('app.nodeEnv') === 'development'
					? [
							{ level: 'query', emit: 'event' },
							{ level: 'error', emit: 'stdout' },
							{ level: 'warn', emit: 'stdout' },
						]
					: [{ level: 'error', emit: 'stdout' }],
		})

		this.pool = pool
	}

	async onModuleInit(): Promise<void> {
		await this.$connect()
		this.logger.log('Database connection established')

		if (process.env.NODE_ENV === 'development') {
			// @ts-expect-error - событие $on для query
			this.$on('query', (e: { query: string; duration: number }) => {
				if (e.duration > 100) {
					this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`)
				}
			})
		}
	}

	async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
		await this.pool.end()
		this.logger.log('Database connection closed')
	}

	async healthCheck(): Promise<boolean> {
		try {
			await this.$queryRaw`SELECT 1`
			return true
		} catch {
			return false
		}
	}
}
