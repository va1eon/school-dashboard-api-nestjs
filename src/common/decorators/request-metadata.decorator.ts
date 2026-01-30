import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

import type { RequestMetadata } from '../types'

export const GetRequestMetadataDecorator = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): RequestMetadata => {
		const request = ctx.switchToHttp().getRequest<Request>()

		const forwarded = request.headers['x-forwarded-for']
		const ipAddress =
			(typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
			request.socket?.remoteAddress ||
			request.ip ||
			undefined

		return {
			userAgent: request.headers['user-agent'],
			ipAddress,
		}
	}
)
