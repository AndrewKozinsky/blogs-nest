import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import useragent from 'express-useragent'

@Injectable()
export class BrowserService {
	// Returns client's device IP
	getClientIP(req: Request): string {
		return req.header('x-forwarded-for') || req.socket.remoteAddress || 'unknown'
	}

	// Returns client's device name
	getClientName(req: Request): string {
		const source = req.headers['user-agent'] || ''
		const browserInfo = useragent.parse(source)

		return browserInfo.browser + ' ' + browserInfo.version
	}
}
