import { createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { config } from '../../settings/config'

@Injectable()
export class RequestService {
	getDeviceRefreshStrTokenFromReq(req: Request): string {
		try {
			const cookiesObj = this.transformCookiesStringToObj(req.headers.cookie!)
			console.log({ cookies_obj: cookiesObj })
			return cookiesObj[config.refreshToken.name]
		} catch (err) {
			throw new Error()
		}
	}
	transformCookiesStringToObj(cookiesStr: string) {
		const keyAndValueArr = cookiesStr.split('; ')
		console.log(keyAndValueArr)

		return keyAndValueArr.reduce((acc, itemObj) => {
			const [key, value] = itemObj.split('=')

			acc[key] = value
			return acc
		}, {})
	}
}

export const RefreshToken = createParamDecorator(
	async (data: unknown, context: ExecutionContext): Promise<string> => {
		const request = await context.switchToHttp().getRequest()

		return request.cookies && request.cookies.refreshToken ? request.cookies.refreshToken : null
	},
)
