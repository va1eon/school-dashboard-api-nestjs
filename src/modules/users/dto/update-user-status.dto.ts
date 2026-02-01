import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

import { UserStatus } from '@/prisma/generated/client'

export class UpdateUserStatusDto {
	@ApiProperty({
		enum: UserStatus,
		description: 'Новый статус пользователя',
	})
	@IsEnum(UserStatus, { message: 'Некорректный статус' })
	status!: UserStatus
}
