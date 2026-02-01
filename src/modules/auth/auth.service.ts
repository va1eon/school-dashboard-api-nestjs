import {
	ConflictException,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { StringValue } from 'ms'

import { UserRole, UserStatus } from '@/prisma/generated/client'
import {
	InputJsonValue,
	NullableJsonNullValueInput,
} from '@/prisma/generated/internal/prismaNamespace'
import type { AuthUser, JwtPayload, RequestMetadata } from '@/common/types'
import { DateUtil, PasswordUtil } from '@/common/utils'

import { PrismaService } from '../prisma/prisma.service'
import {
	AuthResponseDto,
	AuthUserDto,
	LoginDto,
	RegisterDto,
	TokensResponseDto,
	UserPublicRole,
} from './dto'

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)
	private readonly MAX_REFRESH_TOKENS = 5

	constructor(
		private readonly prismaService: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
	) {}

	// ------------------- Публичная регистрация -------------------
	async register(
		dto: RegisterDto,
		metadata?: RequestMetadata
	): Promise<AuthResponseDto> {
		const { email, password, firstName, lastName, middleName, publicRole } = dto

		// Разрешаем только STUDENT и PARENT
		const role =
			publicRole === UserPublicRole.STUDENT ? UserRole.STUDENT : UserRole.PARENT

		const existingUser = await this.prismaService.user.findUnique({
			where: { email },
		})
		if (existingUser) {
			throw new ConflictException('Пользователь с таким email уже существует')
		}

		const hashedPassword = await PasswordUtil.hash(password)

		const user = await this.prismaService.$transaction(async tx => {
			const newUser = await tx.user.create({
				data: {
					email,
					password: hashedPassword,
					role,
					status: UserStatus.PENDING,
					profile: { create: { firstName, lastName, middleName } },
				},
				include: { profile: true },
			})

			await this.createRoleRecord(tx, newUser.id, role)
			await tx.notificationSettings.create({ data: { userId: newUser.id } })

			return newUser
		})

		const tokens = await this.generateTokens(user)
		await this.saveRefreshToken(user.id, tokens.refreshToken, metadata)
		await this.logActivity(user.id, 'register', 'User', user.id, metadata)

		this.logger.log(`User registered: ${user.email}`)

		return { ...tokens, user: this.formatUser(user) }
	}

	// ------------------- Вход -------------------
	async login(dto: LoginDto, metadata?: RequestMetadata): Promise<AuthResponseDto> {
		const { email, password } = dto

		const user = await this.prismaService.user.findUnique({
			where: { email },
			include: { profile: true },
		})
		if (!user) throw new UnauthorizedException('Неверный email или пароль')

		this.validateUserStatus(user.status)

		const isPasswordValid = await PasswordUtil.verify(user.password, password)
		if (!isPasswordValid)
			throw new UnauthorizedException('Неверный email или пароль')

		// Обновляем lastLoginAt и, при необходимости, хеш пароля
		const updatedData: Partial<{ password: string; lastLoginAt: Date }> = {
			lastLoginAt: new Date(),
		}
		if (PasswordUtil.needsRehash(user.password)) {
			updatedData.password = await PasswordUtil.hash(password)
		}

		await this.prismaService.user.update({
			where: { id: user.id },
			data: updatedData,
		})

		const tokens = await this.generateTokens(user)
		await this.saveRefreshToken(user.id, tokens.refreshToken, metadata)
		await this.logActivity(user.id, 'login', 'User', user.id, metadata)

		return { ...tokens, user: this.formatUser(user) }
	}

	// ------------------- Refresh токены -------------------
	async refreshTokens(
		refreshToken: string,
		metadata?: RequestMetadata
	): Promise<TokensResponseDto> {
		const tokenRecord = await this.prismaService.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { user: true },
		})
		if (!tokenRecord) throw new UnauthorizedException('Невалидный refresh токен')
		if (DateUtil.isExpired(tokenRecord.expiresAt)) {
			await this.prismaService.refreshToken.delete({ where: { id: tokenRecord.id } })
			throw new UnauthorizedException('Истек срок действия refresh токена')
		}

		this.validateUserStatus(tokenRecord.user.status)

		// Удаляем старый токен и создаём новый в транзакции
		return this.prismaService.$transaction(async tx => {
			await tx.refreshToken.delete({ where: { id: tokenRecord.id } })
			const newTokens = await this.generateTokens(tokenRecord.user)
			await this.saveRefreshToken(
				tokenRecord.user.id,
				newTokens.refreshToken,
				metadata
			)
			return newTokens
		})
	}

	// ------------------- Выход -------------------
	async logoutByRefreshToken(refreshToken: string): Promise<void> {
		const tokenRecord = await this.prismaService.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { user: true },
		})

		if (!tokenRecord) {
			throw new UnauthorizedException('Невалидный refresh токен')
		}

		await this.prismaService.refreshToken.delete({ where: { id: tokenRecord.id } })

		await this.logActivity(tokenRecord.userId, 'logout', 'User', tokenRecord.userId)
	}

	async logoutAll(userId: string): Promise<void> {
		const { count } = await this.prismaService.refreshToken.deleteMany({
			where: { userId },
		})

		await this.logActivity(userId, 'logout_all', 'User', userId, undefined, {
			tokensRemoved: count,
		})
		this.logger.log(`User logged out from all devices: ${userId}`)
	}

	// ------------------- Приватные методы -------------------
	// Генерация JWT access и refresh токенов
	private async generateTokens(
		user: Pick<AuthUser, 'id' | 'email' | 'role'>
	): Promise<TokensResponseDto> {
		const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role }

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(payload, {
				secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
				expiresIn: this.configService.getOrThrow<string>(
					'jwt.accessExpiresIn'
				) as StringValue,
			}),
			this.jwtService.signAsync(payload, {
				secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
				expiresIn: this.configService.getOrThrow<string>(
					'jwt.refreshExpiresIn'
				) as StringValue,
			}),
		])

		return { accessToken, refreshToken }
	}

	// Сохранение refresh-токена и управление лимитом токенов
	private async saveRefreshToken(
		userId: string,
		token: string,
		metadata?: RequestMetadata
	): Promise<void> {
		const expiresIn =
			(this.configService.getOrThrow<string>(
				'jwt.refreshExpiresIn'
			) as StringValue) || '7d'
		const expiresAt = DateUtil.parseExpiresIn(expiresIn)

		const tokenCount = await this.prismaService.refreshToken.count({
			where: { userId },
		})

		// Ограничение максимального числа refresh токенов
		if (tokenCount >= this.MAX_REFRESH_TOKENS) {
			const oldestTokens = await this.prismaService.refreshToken.findMany({
				where: { userId },
				orderBy: { createdAt: 'asc' },
				take: tokenCount - this.MAX_REFRESH_TOKENS + 1,
				select: { id: true },
			})
			await this.prismaService.refreshToken.deleteMany({
				where: { id: { in: oldestTokens.map(t => t.id) } },
			})
		}

		await this.prismaService.refreshToken.create({
			data: {
				userId,
				token,
				expiresAt,
				userAgent: metadata?.userAgent?.substring(0, 500),
				ipAddress: metadata?.ipAddress?.substring(0, 45),
			},
		})
	}

	// Создание связанной записи роли пользователя
	private async createRoleRecord(
		tx: Parameters<Parameters<typeof this.prismaService.$transaction>[0]>[0],
		userId: string,
		role: UserRole
	): Promise<void> {
		const roleCreators = {
			[UserRole.STUDENT]: () => tx.student.create({ data: { userId } }),
			[UserRole.PARENT]: () => tx.parent.create({ data: { userId } }),
			[UserRole.TEACHER]: () => tx.teacher.create({ data: { userId } }),
			[UserRole.ADMIN]: () => tx.admin.create({ data: { userId } }),
		}

		if (!roleCreators[role]) throw new Error(`Unsupported role: ${role}`)
		await roleCreators[role]()
	}

	// Проверка статуса пользователя
	private validateUserStatus(status: UserStatus): void {
		if (status === UserStatus.SUSPENDED || status === UserStatus.INACTIVE)
			throw new UnauthorizedException('Аккаунт заблокирован')

		if (status === UserStatus.PENDING)
			throw new UnauthorizedException('Пожалуйста, подтвердите email')
	}

	// Форматирование пользователя для ответа
	private formatUser(user: AuthUser): AuthUserDto {
		return {
			id: user.id,
			email: user.email,
			role: user.role,
			status: user.status,
			profile: user.profile
				? {
						firstName: user.profile.firstName,
						lastName: user.profile.lastName,
						middleName: user.profile.middleName,
						avatar: user.profile.avatar,
					}
				: null,
		}
	}

	// Логирование активности пользователя
	private async logActivity(
		userId: string,
		action: string,
		entity: string,
		entityId: string,
		metadata?: RequestMetadata,
		extraData?: NullableJsonNullValueInput | InputJsonValue
	): Promise<void> {
		try {
			await this.prismaService.activityLog.create({
				data: {
					userId,
					action,
					entity,
					entityId,
					ipAddress: metadata?.ipAddress,
					userAgent: metadata?.userAgent?.substring(0, 500),
					metadata: extraData,
				},
			})
		} catch (error: any) {
			this.logger.warn(`Failed to log activity: ${error}`)
		}
	}
}
