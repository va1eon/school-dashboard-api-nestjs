import { ApiProperty } from '@nestjs/swagger'
import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class ChangePasswordDto {
	@ApiProperty({ description: 'Текущий пароль' })
	@IsString()
	@MinLength(1, { message: 'Введите текущий пароль' })
	currentPassword!: string

	@ApiProperty({
		description: 'Новый пароль. Должен содержать заглавные, строчные буквы и цифры',
		minLength: 8,
		maxLength: 72,
		pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
	})
	@IsString()
	@MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
	@MaxLength(72, { message: 'Пароль слишком длинный' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'Пароль должен содержать заглавные, строчные буквы и цифры',
	})
	newPassword!: string
}
