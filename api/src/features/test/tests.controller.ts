import { BadRequestException, Controller, Delete, HttpStatus, Res } from '@nestjs/common'
import { Response } from 'express'
import RouteNames from '../../settings/routeNames'
import { DbService } from '../../db/mongo/dbService'

@Controller(RouteNames.TESTING.value)
export class TestsController {
	constructor(private dbService: DbService) {}

	/*@Delete(RouteNames.TESTING.ALL_DATA.value)
	async deleteAllData(@Res() res: Response) {
		const isDropped = await this.dbService.drop()

		if (isDropped) {
			res.sendStatus(HttpStatus.NO_CONTENT)
			return
		}

		throw new BadRequestException()
	}*/
}
