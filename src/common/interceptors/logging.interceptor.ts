import {
	Injectable,
	Logger,
	type CallHandler,
	type ExecutionContext,
	type NestInterceptor,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { tap, type Observable } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP')

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const ctx = context.switchToHttp()
		const request = ctx.getRequest<Request>()
		const { method, url } = request
		const startTime = Date.now()

		return next.handle().pipe(
			tap({
				next: () => {
					const response = ctx.getResponse<Response>()
					const statusCode = response.statusCode
					const duration = Date.now() - startTime

					this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`)
				},
				error: (error: { status: number } & Error) => {
					const duration = Date.now() - startTime
					const status = error?.status || 500

					this.logger.error(`${method} ${url} ${status} - ${duration}ms`)
				},
			})
		)
	}
}
