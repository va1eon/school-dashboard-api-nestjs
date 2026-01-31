import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import {
	CurrentUserDecorator,
	GetRequestMetadataDecorator,
	PublicDecorator,
} from '@/common/decorators'
import { JwtAuthGuard } from '@/common/guards'
import type { RequestMetadata } from '@/common/types'

import { AuthService } from './auth.service'
import {
	AuthResponseDto,
	LoginDto,
	MessageResponseDto,
	RefreshTokenDto,
	RegisterDto,
	TokensResponseDto,
} from './dto'

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@PublicDecorator()
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({ summary: 'Регистрация нового пользователя' })
	@ApiBody({ type: RegisterDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Пользователь успешно зарегистрирован',
		type: AuthResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: 'Пользователь с таким email уже существует',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Ошибка валидации данных',
	})
	async register(
		@Body() dto: RegisterDto,
		@GetRequestMetadataDecorator() metadata: RequestMetadata
	): Promise<AuthResponseDto> {
		return this.authService.register(dto, metadata)
	}

	@PublicDecorator()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({ summary: 'Вход в систему' })
	@ApiBody({ type: LoginDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Успешный вход',
		type: AuthResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Неверные учётные данные',
	})
	async login(
		@Body() dto: LoginDto,
		@GetRequestMetadataDecorator() metadata: RequestMetadata
	): Promise<AuthResponseDto> {
		return this.authService.login(dto, metadata)
	}

	@PublicDecorator()
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@ApiOperation({ summary: 'Обновление токенов' })
	@ApiBody({ type: RefreshTokenDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Токены успешно обновлены',
		type: TokensResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Невалидный или истёкший refresh токен',
	})
	async refreshTokens(
		@Body() dto: RefreshTokenDto,
		@GetRequestMetadataDecorator() metadata: RequestMetadata
	): Promise<TokensResponseDto> {
		return this.authService.refreshTokens(dto.refreshToken, metadata)
	}

	@PublicDecorator()
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Выход из системы по refresh токену' })
	@ApiBody({ type: RefreshTokenDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Успешный выход',
		type: MessageResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Невалидный или уже удалённый refresh токен',
	})
	async logout(@Body() dto: RefreshTokenDto): Promise<MessageResponseDto> {
		await this.authService.logoutByRefreshToken(dto.refreshToken)
		return { message: 'Успешный выход из системы' }
	}

	@ApiBearerAuth('JWT-auth')
	@UseGuards(JwtAuthGuard)
	@Post('logout-all')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Выход со всех устройств' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Успешный выход со всех устройств',
		type: MessageResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Требуется валидный access токен',
	})
	async logoutAll(
		@CurrentUserDecorator('id') userId: string
	): Promise<MessageResponseDto> {
		await this.authService.logoutAll(userId)
		return { message: 'Успешный выход со всех устройств' }
	}
}
