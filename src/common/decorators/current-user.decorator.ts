import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { User } from '@/prisma/generated/client'

import type { RequestWithUser } from '../types'

export const CurrentUserDecorator = createParamDecorator(
	(data: keyof User | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest<RequestWithUser>()
		const user = request.user

		if (!user) {
			return null
		}

		return data ? user[data] : user
	}
)
