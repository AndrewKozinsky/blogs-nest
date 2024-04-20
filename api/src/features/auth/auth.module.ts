import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { DeviceToken, DeviceTokenSchema } from '../../db/schemas/deviceToken.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { CommonService } from '../common/common.service'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'

const useCases = []

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
		]),
	],
	controllers: [AuthController],
	providers: [
		JwtService,
		CommandBus,
		AuthRepository,
		HashAdapter,
		CommonService,
		RequestService,
		...useCases,
	],
})
export class AuthModule {}
