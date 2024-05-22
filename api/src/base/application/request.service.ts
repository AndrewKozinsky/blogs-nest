import { createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { config } from '../../settings/config'

@Injectable()
export class RequestService {
	getRefreshTokenStrFromReq(req: Request): null | string {
		if (!req.cookies) return null
		return req.cookies[config.refreshToken.name]
	}
}

export const RefreshToken = createParamDecorator(
	async (data: unknown, context: ExecutionContext): Promise<string> => {
		const request = await context.switchToHttp().getRequest()

		return request.cookies && request.cookies.refreshToken ? request.cookies.refreshToken : null
	},
)
