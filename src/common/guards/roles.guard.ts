import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { UserRole } from '@/prisma/generated/client'

import { ROLES_KEY } from '../decorators'
import type { RequestWithUser } from '../types'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requireRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		])

		if (!requireRoles || requireRoles.length === 0) {
			return true
		}

		const request = context.switchToHttp().getRequest<RequestWithUser>()
		const user = request.user

		if (!user) {
			throw new ForbiddenException('Доступ запрещен')
		}

		const hasRole = requireRoles.includes(user.role)

		if (!hasRole) {
			throw new ForbiddenException(
				`Требуется одна из ролей ${requireRoles.join(', ')}`
			)
		}

		return true
	}
}
