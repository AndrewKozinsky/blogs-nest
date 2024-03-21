import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { config } from '../config/config'

@Injectable()
export class RequestService {
	getDeviceRefreshStrTokenFromReq(req: Request): string {
		return req.cookies[config.refreshToken.name]
	}
}
