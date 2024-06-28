import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	HttpStatus,
	HttpException,
} from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { addMilliseconds } from 'date-fns'
import { DataSource } from 'typeorm'
import { BrowserService } from '../../base/application/browser.service'
import { RateLimit } from '../../db/pg/entities/rateLimit'
import { config } from '../../settings/config'

@Injectable()
export class RequestsLimiterGuard implements CanActivate {
	constructor(
		private browserService: BrowserService,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		return true

		//----

		const req = context.switchToHttp().getRequest()
		const res = context.switchToHttp().getResponse()

		const ip = this.browserService.getClientIP(req)
		const { method, path } = req

		const oldTime = addMilliseconds(new Date(), -config.reqLimit.durationInMs)

		const lastRequests = await this.dataSource
			.getRepository(RateLimit)
			.createQueryBuilder()
			.where({ ip, path, method })
			.andWhere('date > :oldTime', { oldTime })
			.getMany()

		if (lastRequests.length < config.reqLimit.max) {
			const date = new Date().toISOString()

			await this.dataSource.getRepository(RateLimit).insert({
				method,
				path,
				ip,
				date,
			})

			return true
		} else {
			throw new HttpException('To many requests', HttpStatus.TOO_MANY_REQUESTS)
		}
	}
}
