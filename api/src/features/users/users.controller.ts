import {
	BadRequestException,
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
import { Response } from 'express'
import { CheckAdminAuthGuard } from '../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../settings/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import {
	CreateUserDtoModel,
	GetUsersQueries,
	GetUsersQueriesPipe,
} from './models/users.input.model'
import { CreateUserUseCase } from './use-cases/createUser.useCase'
import { DeleteUserUseCase } from './use-cases/deleteUser.useCase'
import { UsersQueryRepository } from './usersQueryRepository'

@Controller(RouteNames.USERS.value)
export class UsersController {
	constructor(
		private usersQueryRepository: UsersQueryRepository,
		private createUserUseCase: CreateUserUseCase,
		private deleteUserUseCase: DeleteUserUseCase,
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
		const createdUserStatus = await this.createUserUseCase.execute(body)

		if (createdUserStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException([{ field: 'email', message: 'User already registered' }])
		}

		if (createdUserStatus) return createdUserStatus.data
	}

	// Delete user specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':userId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('userId') userId: string) {
		const isUserDeleted = await this.deleteUserUseCase.execute(userId)

		if (!isUserDeleted) {
			throw new NotFoundException()
		}
	}
}

/*const received = {
	pagesCount: 1,
	page: 1,
	pageSize: 15,
	totalCount: 9,
	items: [
		{
			id: '914',
			email: 'emai@gg.com',
			login: 'log01',
			createdAt: '2024-06-27T13:43:19.849Z'
		},
		{
			id: '915',
			email: 'email2p@g.com',
			login: 'log02',
			createdAt: '2024-06-27T13:43:20.007Z',
		},
		{
			id: '916',
			email: 'email2p@gg.om',
			login: 'loSer',
			createdAt: '2024-06-27T13:43:20.170Z',
		},
	],
}*/
