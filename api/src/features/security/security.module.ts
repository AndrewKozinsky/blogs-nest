import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { DeviceToken, DeviceTokenSchema } from '../../db/schemas/deviceToken.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { AuthRepository } from '../auth/auth.repository'
import { CommonService } from '../common/common.service'
import { SecurityController } from './security.controller'
import { SecurityQueryRepository } from './security.queryRepository'
import { SecurityRepository } from './security.repository'
import { TerminateAllDeviceRefreshTokensApartThisUseCase } from './use-cases/terminateAllDeviceRefreshTokensApartThisUseCase'
import { TerminateSpecifiedDeviceRefreshTokenUseCase } from './use-cases/terminateSpecifiedDeviceRefreshTokenUseCase'

const useCases = [
	TerminateAllDeviceRefreshTokensApartThisUseCase,
	TerminateSpecifiedDeviceRefreshTokenUseCase,
]

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
		]),
	],
	controllers: [SecurityController],
	providers: [
		RequestService,
		SecurityQueryRepository,
		AuthRepository,
		HashAdapter,
		CommonService,
		JwtService,
		SecurityRepository,
		...useCases,
	],
})
export class SecurityModule {}
