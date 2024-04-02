import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { NextFunction, Request, Response } from 'express'
import { Model } from 'mongoose'
import { BrowserService } from '../../base/application/browser.service'
import { addMilliseconds } from 'date-fns'
import { DBTypes } from '../../db/dbTypes'
import { RateLimit } from '../../db/schemas/rateLimit.schema'
import { config } from '../../settings/config'

@Injectable()
export class RequestsLimiterMiddleware implements NestMiddleware {
	constructor(
		private browserService: BrowserService,
		@InjectModel(RateLimit.name) private RateLimitModel: Model<RateLimit>,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		/*const ip = this.browserService.getClientIP(req)
		const { method, path } = req

		const oldTime = addMilliseconds(new Date(), -config.reqLimit.durationInMs)

		const lastRequests = await this.RateLimitModel.find({
			ip,
			path,
			method,
			date: { $gte: oldTime },
		}).lean()

		if (lastRequests.length < config.reqLimit.max) {
			const newRequest: DBTypes.RateLimit = {
				method,
				path,
				ip,
				date: new Date(),
			}

			await this.RateLimitModel.insertMany(newRequest)

			next()
			return
		}

		res.sendStatus(HttpStatus.TOO_MANY_REQUESTS)*/

		// ---

		next()
	}
}
