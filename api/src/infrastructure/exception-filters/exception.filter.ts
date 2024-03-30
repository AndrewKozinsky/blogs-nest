import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	BadRequestException,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()
		const status = exception.getStatus()

		if (status === 400) {
			const errorResponse = {
				// @ts-ignore
				errors: response.message.map((m) => {
					return m
				}),
			}

			response.status(status).json(errorResponse)
		} else {
			response.status(status).json({
				statusCode: status,
				timestamp: new Date().toISOString(),
				path: request.url,
			})
		}
	}
}
