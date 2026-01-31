import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { StringValue } from 'ms'

import { JwtStrategy } from '@/modules/auth/strategies'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>('jwt.accessSecret'),
				signOptions: {
					expiresIn: configService.get<string>(
						'jwt.accessExpiresIn',
						'15m'
					) as StringValue,
				},
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
})
export class AuthModule {}
