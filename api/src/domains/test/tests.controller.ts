import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
} from '@nestjs/common'
import RouteNames from '../../config/routeNames'
import { Request, Response } from 'express'
import { DbService } from '../../db/dbService'

@Controller(RouteNames.testing)
export class TestsController {
	constructor(private dbService: DbService) {}

	@Delete('all-data')
	@HttpCode(HttpStatus.BAD_REQUEST)
	async deleteAllData(@Res() res: Response) {
		const isDropped = await this.dbService.drop()

		if (isDropped) {
			res.sendStatus(HttpStatus.NO_CONTENT)
			return
		}
	}
}
