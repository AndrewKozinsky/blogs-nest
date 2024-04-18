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
import { CommandBus } from '@nestjs/cqrs'
import { Response } from 'express'
import { CheckAdminAuthGuard } from '../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../settings/routeNames'
import {
	CreateUserDtoModel,
	GetUsersQueries,
	GetUsersQueriesPipe,
} from './models/users.input.model'
import { CreateUserCommand } from './use-cases/createUser.useCase'
import { DeleteUserCommand } from './use-cases/deleteUser.useCase'
import { UsersQueryRepository } from './users.queryRepository'

@Controller(RouteNames.USERS.value)
export class UsersController {
	constructor(
		private commandBus: CommandBus,
		private usersQueryRepository: UsersQueryRepository,
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
		const createdUser = await this.commandBus.execute(new CreateUserCommand(body))
		return createdUser
	}

	// Delete user specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':userId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('userId') userId: string) {
		const isUserDeleted = await this.commandBus.execute(new DeleteUserCommand(userId))

		if (!isUserDeleted) {
			throw new NotFoundException()
		}
	}
}
