import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { UsersController } from './users.controller'
import { UsersQueryRepository } from './users.queryRepository'

const useCases = []

@Module({
	imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
	controllers: [UsersController],
	providers: [UsersQueryRepository, CommandBus, ...useCases],
})
export class UsersModule {}
