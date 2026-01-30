import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'

export interface SuccessResponse<T> {
	success: true
	data: T
	timestamp: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
	T,
	SuccessResponse<T>
> {
	intercept(
		_context: ExecutionContext,
		next: CallHandler
	): Observable<SuccessResponse<T>> {
		return next.handle().pipe(
			map((data: T) => ({
				success: true as const,
				data,
				timestamp: new Date().toISOString(),
			}))
		)
	}
}
