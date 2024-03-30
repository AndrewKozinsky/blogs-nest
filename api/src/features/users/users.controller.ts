import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Query,
	Res,
	UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { CheckAdminAuthGuard } from '../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../settings/routeNames'
import { GetPostsQueries, GetPostsQueriesPipe } from '../posts/model/posts.input.model'
import {
	CreateUserDtoModel,
	GetUsersQueries,
	GetUsersQueriesPipe,
} from './models/users.input.model'
import { UsersQueryRepository } from './users.queryRepository'
import { UsersService } from './users.service'

@Controller(RouteNames.USERS.value)
export class UsersController {
	constructor(
		private usersQueryRepository: UsersQueryRepository,
		private usersService: UsersService,
	) {}

	// Returns all users
	@UseGuards(CheckAdminAuthGuard)
	@Get()
	async getUsers(@Query(new GetUsersQueriesPipe()) query: GetUsersQueries, @Res() res: Response) {
		const users = await this.usersQueryRepository.getUsers(query)

		res.status(HttpStatus.OK).send(users)
	}

	// Create new user by the admin
	@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createUser(@Body() body: CreateUserDtoModel) {
		const createdUserId = await this.usersService.createUserByAdmin(body)

		return await this.usersQueryRepository.getUser(createdUserId)
	}

	// Delete user specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':userId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('userId') userId: string) {
		const isUserDeleted = await this.usersService.deleteUser(userId)

		if (!isUserDeleted) {
			throw new NotFoundException()
		}
	}
}
