import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Res,
} from '@nestjs/common'
import { Request, Response } from 'express'
import RouteNames from '../../config/routeNames'
import { CreateUserDtoModel, GetUsersQueries } from './models/users.input.model'
import { UsersQueryRepository } from './users.queryRepository'
import { UsersService } from './users.service'

@Controller(RouteNames.users)
export class UsersController {
	constructor(
		private usersQueryRepository: UsersQueryRepository,
		private usersService: UsersService,
	) {}

	// Returns all users
	@Get()
	async getUsers(@Query() query: GetUsersQueries, @Res() res: Response) {
		const users = await this.usersQueryRepository.getUsers(query)

		res.status(HttpStatus.OK).send(users)
	}

	// ---

	// Create new user by the admin
	@Post()
	async createUser(@Body() body: CreateUserDtoModel, @Res() res: Response) {
		const createdUserId = await this.usersService.createUserByAdmin(body)

		const getUserRes = await this.usersQueryRepository.getUser(createdUserId)

		res.status(HttpStatus.CREATED).send(getUserRes)
	}

	@Delete(':userId')
	async deleteUser(@Param('userId') userId: string, @Res() res: Response) {
		const isUserDeleted = await this.usersService.deleteUser(userId)

		if (!isUserDeleted) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.sendStatus(HttpStatus.NO_CONTENT)
	}
}
