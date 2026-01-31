import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class LoginDto {
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
		description: 'Пароль',
	})
	@IsString({ message: 'Пароль должен быть строкой' })
	@IsNotEmpty({ message: 'Введите пароль' })
	@MaxLength(72, { message: 'Пароль слишком длинный' })
	password!: string
}
