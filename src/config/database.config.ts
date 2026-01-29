import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
	url: process.env.POSTGRES_URI,
}))
