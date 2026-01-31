import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { UserRole, UserStatus } from '@/prisma/generated/client'

export class TokensResponseDto {
	@ApiProperty({ type: String, description: 'Access токен' })
	accessToken!: string

	@ApiProperty({ type: String, description: 'Refresh токен' })
	refreshToken!: string
}

export class UserProfileDto {
	@ApiProperty()
	firstName!: string

	@ApiProperty()
	lastName!: string

	@ApiPropertyOptional()
	middleName?: string | null

	@ApiPropertyOptional()
	avatar?: string | null
}

export class AuthUserDto {
	@ApiProperty()
	id!: string

	@ApiProperty()
	email!: string

	@ApiProperty({ enum: UserRole })
	role!: UserRole

	@ApiProperty({ enum: UserStatus })
	status!: UserStatus

	@ApiPropertyOptional({ type: UserProfileDto })
	profile?: UserProfileDto | null
}

export class AuthResponseDto extends TokensResponseDto {
	@ApiProperty({ type: AuthUserDto })
	user!: AuthUserDto
}

export class MessageResponseDto {
	@ApiProperty({ example: 'OK' })
	message!: string
}
