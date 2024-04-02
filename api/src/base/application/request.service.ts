import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { config } from '../../settings/config'

@Injectable()
export class RequestService {
	getDeviceRefreshStrTokenFromReq(req: Request): string {
		try {
			return req.cookies[config.refreshToken.name]
		} catch (err: unknown) {
			return ''
		}
	}
}
