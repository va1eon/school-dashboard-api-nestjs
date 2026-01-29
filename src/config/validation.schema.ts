import Joi from 'joi'

export const validationSchema = Joi.object({
	// App
	NODE_ENV: Joi.string()
		.valid('development', 'production', 'test')
		.default('development'),
	APP_PORT: Joi.number().default(3000),
	API_PREFIX: Joi.string().default('api/v1'),
	CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

	// Database
	DATABASE_URL: Joi.string().required(),

	// JWT
	JWT_ACCESS_SECRET: Joi.string().required().min(32),
	JWT_REFRESH_SECRET: Joi.string().required().min(32),
	JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
	JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

	// Redis
	REDIS_HOST: Joi.string().default('localhost'),
	REDIS_PORT: Joi.number().default(6379),
	REDIS_PASSWORD: Joi.string().optional().allow(''),

	// Throttle
	THROTTLE_TTL: Joi.number().default(60000),
	THROTTLE_LIMIT: Joi.number().default(100),
})
