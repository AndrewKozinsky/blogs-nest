import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { config } from '../../settings/config'

@Injectable()
export class RequestService {
	getDeviceRefreshStrTokenFromReq(req: Request): string {
		try {
			const cookiesObj = this.transformCookiesStringToObj(req.headers.cookie!)
			return cookiesObj[config.refreshToken.name]
		} catch (err: unknown) {
			return ''
		}
	}
	transformCookiesStringToObj(cookiesStr: string) {
		const keyAndValueArr = cookiesStr.split('; ')

		return keyAndValueArr.reduce((acc, itemObj) => {
			const [key, value] = itemObj.split('=')

			acc[key] = value
			return acc
		}, {})
	}
}
