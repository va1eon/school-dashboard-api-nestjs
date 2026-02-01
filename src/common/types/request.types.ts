import type { Request } from 'express'

import type { Profile, User } from '@/prisma/generated/client'

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
	profile?: Pick<Profile, 'firstName' | 'lastName' | 'middleName' | 'avatar'> | null
}

export interface RequestWithUser extends Request {
	user?: AuthUser
}

export interface PaginationMeta {
	total: number
	page: number
	limit: number
	totalPages: number
	hasNextPage: boolean
	hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}
