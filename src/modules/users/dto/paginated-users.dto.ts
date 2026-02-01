import { ApiProperty } from '@nestjs/swagger'

import type { PaginationMeta } from '@/common/types'

import { UserResponseDto } from './user-response.dto'

export class PaginationMetaDto implements PaginationMeta {
	@ApiProperty()
	total!: number

	@ApiProperty()
	page!: number

	@ApiProperty()
	limit!: number

	@ApiProperty()
	totalPages!: number

	@ApiProperty()
	hasNextPage!: boolean

	@ApiProperty()
	hasPreviousPage!: boolean
}

export class PaginatedUsersDto {
	@ApiProperty({ type: [UserResponseDto] })
	data!: UserResponseDto[]

	@ApiProperty({ type: PaginationMetaDto })
	meta!: PaginationMetaDto
}
