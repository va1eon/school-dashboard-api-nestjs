import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator'

export enum UserPublicRole {
	STUDENT = 'STUDENT',
	PARENT = 'PARENT',
}

export class RegisterDto {
	@ApiProperty({
		example: 'user@school.edu',
		description: 'Email пользователя',
	})
	@IsEmail({}, { message: 'Некорректный формат email' })
	@MaxLength(255, { message: 'Email слишком длинный' })
	@Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase().trim() : undefined
	)
	email!: string

	@ApiProperty({
		example: 'SecureP@ss123',
		description: 'Пароль (мин. 8 символов, буквы и цифры)',
	})
	@IsString({ message: 'Пароль должен быть строкой' })
	@MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
	@MaxLength(72, { message: 'Пароль слишком длинный' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'Пароль должен содержать заглавные, строчные буквы и цифры',
	})
	password!: string

	@ApiProperty({
		example: 'Иван',
		description: 'Имя',
	})
	@IsString({ message: 'Имя должно быть строкой' })
	@MinLength(2, { message: 'Имя слишком короткое' })
	@MaxLength(100, { message: 'Имя слишком длинное' })
	@Transform(({ value }) => (typeof value === 'string' ? value?.trim() : undefined))
	firstName!: string

	@ApiProperty({
		example: 'Иванов',
		description: 'Фамилия',
	})
	@IsString({ message: 'Фамилия должна быть строкой' })
	@MinLength(2, { message: 'Фамилия слишком короткая' })
	@MaxLength(100, { message: 'Фамилия слишком длинная' })
	@Transform(({ value }) => (typeof value === 'string' ? value?.trim() : undefined))
	lastName!: string

	@ApiPropertyOptional({
		example: 'Иванович',
		description: 'Отчество',
	})
	@IsOptional()
	@IsString({ message: 'Отчество должно быть строкой' })
	@MaxLength(100, { message: 'Отчество слишком длинное' })
	@Transform(({ value }) => (typeof value === 'string' ? value?.trim() : undefined))
	middleName?: string

	@ApiProperty({
		enum: UserPublicRole,
		example: UserPublicRole.STUDENT,
		description: 'Публичная роль пользователя (STUDENT или PARENT)',
	})
	@IsEnum(UserPublicRole, { message: 'Некорректная роль пользователя' })
	publicRole!: UserPublicRole
}
