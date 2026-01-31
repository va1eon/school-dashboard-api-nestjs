import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import helmet from 'helmet'

import { AppModule } from './app.module'

async function bootstrap() {
	const logger = new Logger('Bootstrap')

	const app = await NestFactory.create(AppModule, {
		logger:
			process.env.NODE_ENV === 'production'
				? ['error', 'warn', 'log']
				: ['error', 'warn', 'log', 'debug', 'verbose'],
	})

	const configService = app.get(ConfigService)

	const port = configService.getOrThrow<number>('app.port')
	const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1')
	const corsOrigin = configService.get<string>(
		'app.corsOrigin',
		'http://localhost:5173'
	)
	const nodeEnv = configService.get<string>('app.nodeEnv', 'development')

	app.use(
		helmet({
			contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
			crossOriginEmbedderPolicy: false,
		})
	)

	app.use(compression())

	// CORS
	app.enableCors({
		origin: corsOrigin.split(',').map(origin => origin.trim()),
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		exposedHeaders: ['X-Total-Count'],
		maxAge: 86400,
	})

	app.setGlobalPrefix(apiPrefix)

	// Swagger documentation
	if (nodeEnv !== 'production') {
		const swaggerConfig = new DocumentBuilder()
			.setTitle('School Management System API')
			.setDescription(
				`
					## Школьная информационная система
					
					API для управления школой, включая:
					- Авторизацию и управление пользователями
					- Расписание занятий
					- Домашние задания
					- Оценки и статистику
					- Чаты и уведомления
					
					### Роли пользователей
					- **STUDENT** - Ученик
					- **PARENT** - Родитель  
					- **TEACHER** - Учитель
					- **ADMIN** - Администратор
      `
			)
			.setVersion('1.0')
			.addBearerAuth(
				{
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Введите JWT токен',
				},
				'JWT-auth'
			)
			.addTag('Авторизация', 'Регистрация, вход, обновление токенов')
			.addTag('Пользователи', 'Управление профилями и пользователями')
			.build()

		const document = SwaggerModule.createDocument(app, swaggerConfig)

		SwaggerModule.setup('api/docs', app, document, {
			swaggerOptions: {
				persistAuthorization: true,
				docExpansion: 'none',
				filter: true,
				showRequestDuration: true,
			},
			customSiteTitle: 'School API Docs',
		})

		logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`)
	}

	app.enableShutdownHooks()

	await app.listen(port)

	logger.log(`🚀 Application running on: http://localhost:${port}/${apiPrefix}`)
	logger.log(`🌍 Environment: ${nodeEnv}`)
}

bootstrap().catch(error => {
	console.error('Failed to start application:', error)
	process.exit(1)
})
