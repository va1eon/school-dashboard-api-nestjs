import { ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from 'class-validator'

import { UserRole, UserStatus } from '@/prisma/generated/client'
import { parseIntNum, trimString } from '@/common/utils'

export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}

export enum UserSortBy {
	CREATED_AT = 'createdAt',
	EMAIL = 'email',
	ROLE = 'role',
	STATUS = 'status',
	LAST_LOGIN_AT = 'lastLoginAt',
	NAME = 'name',
}

export class QueryUsersDto {
	@ApiPropertyOptional({ enum: UserRole })
	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole

	@ApiPropertyOptional({ enum: UserStatus })
	@IsOptional()
	@IsEnum(UserStatus)
	status?: UserStatus

	@ApiPropertyOptional({ description: 'Поиск по email и имени' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	@trimString()
	search?: string

	@ApiPropertyOptional({ default: 1, minimum: 1 })
	@IsOptional()
	@parseIntNum()
	@IsInt()
	@Min(1)
	page?: number = 1

	@ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
	@IsOptional()
	@parseIntNum()
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20

	@ApiPropertyOptional({
		enum: UserSortBy,
		default: UserSortBy.CREATED_AT,
	})
	@IsOptional()
	@IsEnum(UserSortBy)
	sortBy?: UserSortBy = UserSortBy.CREATED_AT

	@ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC
}
