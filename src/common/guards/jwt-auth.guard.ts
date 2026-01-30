import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

import { IS_PUBLIC_KEY } from '../decorators'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private readonly reflector: Reflector) {
		super()
	}

	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		])

		if (isPublic) {
			return true
		}

		return super.canActivate(context)
	}

	handleRequest<T>(error: Error | null, user: T, info: Error | null): T {
		if (error) {
			throw error
		}

		if (!user) {
			const message = info?.message || 'Требуется авторизация'
			throw new UnauthorizedException(message)
		}

		return user
	}
}
