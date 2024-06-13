import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { DeviceToken } from '../../db/mongo/schemas/deviceToken.schema'
import { User, UserSchema } from '../../db/mongo/schemas/user.schema'
import { AuthRepository } from '../auth/authRepository'
import { CommonService } from '../common/common.service'
import { CreateUserUseCase } from './use-cases/createUser.useCase'
import { DeleteUserUseCase } from './use-cases/deleteUser.useCase'
import { UsersController } from './users.controller'
import { UsersQueryRepository } from './usersQueryRepository'
import { UsersRepository } from './usersRepository'

const useCases = [DeleteUserUseCase, CreateUserUseCase]

@Module({
	imports: [],
	controllers: [UsersController],
	providers: [
		UsersQueryRepository,
		CommandBus,
		UsersRepository,
		CommonService,
		HashAdapter,
		AuthRepository,
		JwtService,
		...useCases,
	],
})
export class UsersModule {}
