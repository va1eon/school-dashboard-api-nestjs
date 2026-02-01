import { ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsDateString,
	IsEnum,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator'

import { Gender } from '@/prisma/generated/client'
import { trimString } from '@/common/utils'

export class UpdateProfileDto {
	@ApiPropertyOptional({ example: 'Иван' })
	@IsOptional()
	@IsString()
	@MinLength(2, { message: 'Имя слишком короткое' })
	@MaxLength(100, { message: 'Имя слишком длинное' })
	@trimString()
	firstName?: string

	@ApiPropertyOptional({ example: 'Иванов' })
	@IsOptional()
	@IsString()
	@MinLength(2, { message: 'Фамилия слишком короткая' })
	@MaxLength(100, { message: 'Фамилия слишком длинная' })
	@trimString()
	lastName?: string

	@ApiPropertyOptional({ example: 'Иванович' })
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Отчество слишком длинное' })
	@trimString()
	middleName?: string | null

	@ApiPropertyOptional({
		example: '+79991234567',
		description: 'Международный формат, 10–15 цифр',
	})
	@IsOptional()
	@IsString()
	@Matches(/^\+?[0-9]{10,15}$/, { message: 'Некорректный формат телефона' })
	phone?: string

	@ApiPropertyOptional({ example: '2010-05-15', type: 'string', format: 'date' })
	@IsOptional()
	@IsDateString({}, { message: 'Некорректный формат даты' })
	birthDate?: string

	@ApiPropertyOptional({ enum: Gender })
	@IsOptional()
	@IsEnum(Gender, { message: 'Некорректное значение пола' })
	gender?: Gender

	@ApiPropertyOptional({ example: 'г. Москва, ул. Примерная, д. 1' })
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Адрес слишком длинный' })
	@trimString()
	address?: string

	@ApiPropertyOptional({ example: 'Краткая информация о себе' })
	@IsOptional()
	@IsString()
	@MaxLength(1000, { message: 'Описание слишком длинное' })
	@trimString()
	bio?: string
}
