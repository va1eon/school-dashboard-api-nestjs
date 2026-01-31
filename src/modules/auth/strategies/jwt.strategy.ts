import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { UserStatus } from '@/prisma/generated/client'
import type { AuthUser, JwtPayload } from '@/common/types'
import { PrismaService } from '@/modules/prisma/prisma.service'

@Injectable()
// Стратегия JWT для аутентификации пользователей
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		private readonly configService: ConfigService,
		private readonly prismaService: PrismaService
	) {
		const secretOrKey = configService.getOrThrow<string>('jwt.accessSecret') // Секрет access-токена

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Извлечение токена из Authorization Bearer
			ignoreExpiration: false, // Проверка истечения срока будет на уровне guard
			secretOrKey,
		})
	}

	// Валидация JWT и возврат объекта пользователя
	async validate(payload: JwtPayload): Promise<AuthUser> {
		const user = await this.prismaService.user.findUnique({
			where: { id: payload.sub }, // Идентификатор пользователя из токена
			include: { profile: true }, // Подгружаем профиль
		})

		if (!user) {
			throw new UnauthorizedException('Пользователь не найден') // Пользователь не существует
		}

		if (
			user.status === UserStatus.SUSPENDED ||
			user.status === UserStatus.INACTIVE
		) {
			throw new UnauthorizedException('Аккаунт не доступен') // Пользователь заблокирован или не активен
		}

		// Возврат авторизованного пользователя
		return {
			id: user.id,
			email: user.email,
			role: user.role,
			status: user.status,
			profile: user.profile,
		}
	}
}
