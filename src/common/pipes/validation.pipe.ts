import {
	BadRequestException,
	ValidationError,
	ValidationPipe,
	ValidationPipeOptions,
} from '@nestjs/common'

const formatErrors = (errors: ValidationError[]): string[] => {
	const messages: string[] = []

	for (const error of errors) {
		if (error.constraints) {
			messages.push(...Object.values(error.constraints))
		}

		if (error.children?.length) {
			messages.push(...formatErrors(error.children))
		}
	}

	return messages
}

export const validationPipeOptions: ValidationPipeOptions = {
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	transformOptions: {
		enableImplicitConversion: true,
	},
	stopAtFirstError: false,
	exceptionFactory: (errors: ValidationError[]) => {
		const messages = formatErrors(errors)
		return new BadRequestException({
			message: messages,
			error: 'Validation Error',
			statusCode: 400,
		})
	},
}

export const globalValidationPipe = new ValidationPipe(validationPipeOptions)
