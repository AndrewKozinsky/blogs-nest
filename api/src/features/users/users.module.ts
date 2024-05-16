import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { DeviceToken } from '../../db/mongo/schemas/deviceToken.schema'
import { User, UserSchema } from '../../db/mongo/schemas/user.schema'
import { AuthMongoRepository } from '../auth/auth.mongo.repository'
import { CommonService } from '../common/common.service'
import { CreateUserUseCase } from './use-cases/createUser.useCase'
import { DeleteUserUseCase } from './use-cases/deleteUser.useCase'
import { UsersController } from './users.controller'
import { UsersMongoQueryRepository } from './users.mongo.queryRepository'
import { UsersMongoRepository } from './users.mongo.repository'

const useCases = [DeleteUserUseCase, CreateUserUseCase]

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: DeviceToken.name, schema: DeviceToken },
		]),
	],
	controllers: [UsersController],
	providers: [
		UsersMongoQueryRepository,
		CommandBus,
		UsersMongoRepository,
		CommonService,
		HashAdapter,
		AuthMongoRepository,
		JwtService,
		...useCases,
	],
})
export class UsersModule {}
