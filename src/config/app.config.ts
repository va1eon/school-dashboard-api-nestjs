import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV || 'development',
	port: (process.env.APP_PORT && parseInt(process.env.APP_PORT, 10)) || 3000,
	apiPrefix: process.env.API_PREFIX || 'api/v1',
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	throttle: {
		ttl: (process.env.THROTTLE_TTL && parseInt(process.env.THROTTLE_TTL, 10)) || 60,
		limit:
			(process.env.THROTTLE_LIMIT && parseInt(process.env.THROTTLE_LIMIT, 10)) ||
			100,
	},
}))
