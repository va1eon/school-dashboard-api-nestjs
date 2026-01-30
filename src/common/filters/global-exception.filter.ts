import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { Prisma } from '@/prisma/generated/client'

interface ErrorResponseBody {
	success: false
	statusCode: number
	message: string | string[]
	error: string
	timestamp: string
	path: string
	method: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GlobalExceptionFilter.name)

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		const { status, message, error } = this.extractErrorInfo(exception)

		const errorResponse: ErrorResponseBody = {
			success: false,
			statusCode: status,
			message,
			error,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
		}

		// Логируем серверные ошибки
		if (status >= 500) {
			this.logger.error(
				`${request.method} ${request.url} - ${status}`,
				exception instanceof Error ? exception.stack : String(exception)
			)
		}

		response.status(status).json(errorResponse)
	}

	private extractErrorInfo(exception: unknown): {
		status: number
		message: string | string[]
		error: string
	} {
		// HTTP Exception
		if (exception instanceof HttpException) {
			const status = exception.getStatus()
			const exceptionResponse = exception.getResponse()

			if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
				const resp = exceptionResponse as Record<string, unknown>
				return {
					status,
					message: (resp.message as string | string[]) || exception.message,
					error: (resp.error as string) || 'Error',
				}
			}

			return {
				status,
				message: exception.message,
				error: 'Error',
			}
		}

		// Prisma Errors
		if (exception instanceof Prisma.PrismaClientKnownRequestError) {
			return this.handlePrismaError(exception)
		}

		if (exception instanceof Prisma.PrismaClientValidationError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				message: 'Ошибка валидации данных',
				error: 'Validation Error',
			}
		}

		// Generic Error
		if (exception instanceof Error) {
			this.logger.error(exception.message, exception.stack)
		}

		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Внутренняя ошибка сервера',
			error: 'Internal Server Error',
		}
	}

	private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
		status: number
		message: string
		error: string
	} {
		switch (exception.code) {
			case 'P2002': {
				const fields = (exception.meta?.target as string[]) || ['поле']
				return {
					status: HttpStatus.CONFLICT,
					message: `Значение ${fields.join(', ')} уже существует`,
					error: 'Conflict',
				}
			}

			case 'P2025':
				return {
					status: HttpStatus.NOT_FOUND,
					message: 'Запись не найдена',
					error: 'Not Found',
				}

			case 'P2003':
				return {
					status: HttpStatus.BAD_REQUEST,
					message: 'Нарушение ссылочной целостности',
					error: 'Bad Request',
				}

			case 'P2014':
				return {
					status: HttpStatus.BAD_REQUEST,
					message: 'Нарушение связи между записями',
					error: 'Bad Request',
				}

			default:
				this.logger.error(`Prisma Error ${exception.code}`, exception.message)
				return {
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: 'Ошибка базы данных',
					error: 'Database Error',
				}
		}
	}
}
