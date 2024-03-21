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
	@Get('postId')
	@HttpCode(HttpStatus.OK)
	async getUsers(@Query() query: GetUsersQueries) {
		const users = await this.usersQueryRepository.getUsers(query)
		return users
	}

	// ---

	// Create new user by the admin
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createUser(@Body() body: CreateUserDtoModel) {
		const createdUserId = await this.usersService.createUserByAdmin(body)

		const getUserRes = await this.usersQueryRepository.getUser(createdUserId)

		return getUserRes
	}

	@Delete('userId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('userId') userId: string, @Res() res: Response) {
		const isUserDeleted = await this.usersService.deleteUser(userId)

		if (!isUserDeleted) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}
}
