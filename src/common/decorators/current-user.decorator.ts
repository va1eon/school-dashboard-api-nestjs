import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { AuthUser, RequestWithUser } from '../types'

export const CurrentUserDecorator = createParamDecorator(
	(data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest<RequestWithUser>()
		const user = request.user

		if (!user) {
			return undefined
		}

		return data ? user[data] : user
	}
)
