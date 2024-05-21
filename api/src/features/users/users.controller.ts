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
	/*@UseGuards(CheckAdminAuthGuard)
	@Get()
	async getUsers(@Query(new GetUsersQueriesPipe()) query: GetUsersQueries, @Res() res: Response) {
		const users = await this.usersQueryRepository.getUsers(query)

		res.status(HttpStatus.OK).send(users)
	}*/

	// Create new user by the admin
	/*@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createUser(@Body() body: CreateUserDtoModel) {
		const createdUserStatus = await this.createUserUseCase.execute(body)

		if (createdUserStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException([{ field: 'email', message: 'User already registered' }])
		}

		if (createdUserStatus) return createdUserStatus.data
	}*/

	// Delete user specified by id
	/*@UseGuards(CheckAdminAuthGuard)
	@Delete(':userId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('userId') userId: string) {
		const isUserDeleted = await this.deleteUserUseCase.execute(userId)

		if (!isUserDeleted) {
			throw new NotFoundException()
		}
	}*/
}
