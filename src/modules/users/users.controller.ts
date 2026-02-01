import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'

import * as client from '@/prisma/generated/client'
import { CurrentUserDecorator, RolesDecorator } from '@/common/decorators'
import { JwtAuthGuard, RolesGuard } from '@/common/guards'

import {
	ChangePasswordDto,
	PaginatedUsersDto,
	QueryUsersDto,
	UpdateProfileDto,
	UpdateUserStatusDto,
	UserResponseDto,
} from './dto'
import { UsersService } from './users.service'

@ApiBearerAuth('JWT-auth')
@ApiTags('Пользователи')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@ApiOperation({ summary: 'Получить данные текущего пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Данные текущего пользователя',
		type: UserResponseDto,
	})
	async getMe(@CurrentUserDecorator('id') userId: string): Promise<UserResponseDto> {
		return this.usersService.getMe(userId)
	}

	@Patch('me/profile')
	@ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Профиль успешно обновлён',
		type: UserResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Ошибка валидации',
	})
	async updateMyProfile(
		@CurrentUserDecorator('id') userId: string,
		@Body() dto: UpdateProfileDto
	): Promise<UserResponseDto> {
		return this.usersService.updateProfile(userId, dto)
	}

	@Patch('me/password')
	@ApiOperation({ summary: 'Изменить пароль' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пароль успешно изменён',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Неверный текущий пароль или ошибка валидации',
	})
	async changePassword(
		@CurrentUserDecorator('id') userId: string,
		@Body() dto: ChangePasswordDto
	): Promise<{ message: string }> {
		return this.usersService.changePassword(userId, dto)
	}

	@Get()
	@RolesDecorator(client.UserRole.ADMIN)
	@ApiOperation({ summary: 'Список пользователей (только админ)' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Список пользователей с пагинацией',
		type: PaginatedUsersDto,
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'Доступ запрещён',
	})
	async getUsers(@Query() query: QueryUsersDto): Promise<PaginatedUsersDto> {
		return this.usersService.getUsers(query)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Получить пользователя по ID' })
	@ApiParam({ name: 'id', description: 'UUID пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Данные пользователя',
		type: UserResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Пользователь не найден',
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'Нет доступа к данным пользователя',
	})
	async getUserById(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUserDecorator() currentUser: client.User
	): Promise<UserResponseDto> {
		return this.usersService.getUserById(id, currentUser)
	}

	@Patch(':id/status')
	@RolesDecorator(client.UserRole.ADMIN)
	@ApiOperation({ summary: 'Изменить статус пользователя (только админ)' })
	@ApiParam({ name: 'id', description: 'UUID пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Статус успешно изменён',
		type: UserResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Пользователь не найден',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Нельзя изменить свой статус',
	})
	async updateUserStatus(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateUserStatusDto,
		@CurrentUserDecorator('id') adminId: string
	): Promise<UserResponseDto> {
		return this.usersService.updateUserStatus(id, dto, adminId)
	}

	@Delete(':id')
	@RolesDecorator(client.UserRole.ADMIN)
	@ApiOperation({ summary: 'Удалить пользователя (только админ)' })
	@ApiParam({ name: 'id', description: 'UUID пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пользователь успешно удалён',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Пользователь не найден',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Нельзя удалить свой аккаунт',
	})
	async deleteUser(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUserDecorator('id') adminId: string
	): Promise<{ message: string }> {
		return this.usersService.deleteUser(id, adminId)
	}
}
