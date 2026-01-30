import type { Request } from 'express'

import type { User } from '@/prisma/generated/client'

export interface RequestMetadata {
	userAgent?: string
	ipAddress?: string
}

export interface JwtPayload {
	sub: AuthUser['id']
	email: AuthUser['email']
	role: AuthUser['role']
	iat?: number
	exp?: number
}

export type AuthUser = Pick<User, 'id' | 'email' | 'role' | 'status'> & {
	profile?: {
		firstName: string
		lastName: string
		middleName?: string
		avatar?: string
	} | null
}

export interface RequestWithUser extends Request {
	user?: AuthUser
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
