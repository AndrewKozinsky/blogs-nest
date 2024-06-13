import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { NextFunction, Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { BrowserService } from '../../base/application/browser.service'
import { addMilliseconds } from 'date-fns'
import { config } from '../../settings/config'

@Injectable()
export class RequestsLimiterMiddleware implements NestMiddleware {
	constructor(
		private browserService: BrowserService,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		next()
		return

		//----

		const ip = this.browserService.getClientIP(req)
		const { method, path } = req

		const oldTime = addMilliseconds(new Date(), -config.reqLimit.durationInMs)

		const lastRequestsRes = await this.dataSource.query(
			'SELECT * FROM ratelimites WHERE ip = $1 AND path = $2 AND method = $3 AND date > $4',
			[ip, path, method, oldTime],
		)

		if (lastRequestsRes.length < config.reqLimit.max) {
			const date = new Date().toISOString()
			await this.dataSource.query(
				'INSERT INTO ratelimites ("method", "path", "ip", "date") VALUES($1, $2, $3, $4)',
				[method, path, ip, date],
			)

			next()
			return
		}

		res.sendStatus(HttpStatus.TOO_MANY_REQUESTS)
	}
}
