import type { Request } from 'express'

import type { User, UserRole, UserStatus } from '@/prisma/generated/client'

export interface RequestMetadata {
	userAgent?: string
	ipAddress?: string
}

export interface JwtPayload {
	sub: string
	email: string
	role: UserRole
	iat?: number
	exp?: number
}

export interface AuthenticatedUser {
	id: string
	email: string
	role: UserRole
	status: UserStatus
	profile?: {
		firstName: string
		lastName: string
		middleName?: string
		avatar?: string
	} | null
}

export interface RequestWithUser extends Request {
	user: User
}

export interface PaginationMeta {
	total: number
	page: number
	limit: number
	totalPage: number
	hasNextPage: boolean
	hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}
