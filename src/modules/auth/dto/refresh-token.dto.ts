import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RefreshTokenDto {
	@ApiProperty({
		description: 'Refresh Token',
	})
	@IsString({ message: 'Токен должен быть строкой' })
	@IsNotEmpty({ message: 'Refresh токен обязателен' })
	@MaxLength(2048, { message: 'Refresh токен слишком длинный' })
	refreshToken!: string
}
