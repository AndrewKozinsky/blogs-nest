import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { CommonService } from '../common/common.service'
import { CreateUserUseCase } from './use-cases/createUser.useCase'
import { DeleteUserUseCase } from './use-cases/deleteUser.useCase'
import { UsersController } from './users.controller'
import { UsersQueryRepository } from './users.queryRepository'
import { UsersRepository } from './users.repository'

const useCases = [DeleteUserUseCase, CreateUserUseCase]

@Module({
	imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
	controllers: [UsersController],
	providers: [
		UsersQueryRepository,
		CommandBus,
		UsersRepository,
		CommonService,
		HashAdapter,
		...useCases,
	],
})
export class UsersModule {}
