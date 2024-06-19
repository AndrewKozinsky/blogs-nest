import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { User } from '../../db/pg/entities/user'
import { AuthRepository } from '../auth/authRepository'
import { CommonService } from '../common/common.service'
import { CreateUserUseCase } from './use-cases/createUser.useCase'
import { DeleteUserUseCase } from './use-cases/deleteUser.useCase'
import { UsersController } from './users.controller'
import { UsersQueryRepository } from './usersQueryRepository'
import { UsersRepository } from './usersRepository'

const useCases = [DeleteUserUseCase, CreateUserUseCase]

@Module({
	imports: [TypeOrmModule.forFeature([User, DeviceToken])],
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
