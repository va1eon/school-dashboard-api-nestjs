import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { GlobalExceptionFilter } from './common/filters'
import { JwtAuthGuard, RolesGuard } from './common/guards'
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors'
import { globalValidationPipe } from './common/pipes'
import {
	appConfig,
	databaseConfig,
	jwtConfig,
	redisConfig,
	validationSchema,
} from './config'
import { AuthModule } from './modules/auth/auth.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { UsersModule } from './modules/users/users.module'

@Module({
	imports: [
		// Configuration
		ConfigModule.forRoot({
			isGlobal: true,
			load: [appConfig, databaseConfig, jwtConfig, redisConfig],
			validationSchema,
			validationOptions: {
				abortEarly: false,
			},
		}),

		// Rate limiting
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				throttlers: [
					{
						ttl: configService.get<number>('app.throttle.ttl', 60000),
						limit: configService.get<number>('app.throttle.limit', 100),
					},
				],
			}),
		}),
		PrismaModule,
		AuthModule,
		UsersModule,
	],
	providers: [
		// Global exception filter
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},

		// Global validation pipe
		{
			provide: APP_PIPE,
			useValue: globalValidationPipe,
		},

		// Global interceptors
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor,
		},

		// Global guards
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
	],
})
export class AppModule {}
