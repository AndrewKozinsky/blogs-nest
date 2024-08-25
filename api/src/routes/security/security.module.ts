import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { User } from '../../db/pg/entities/user'
import { AuthRepository } from '../../repositories/authRepository/auth.repository'
import { CommonService } from '../common/common.service'
import { SecurityController } from './security.controller'
import { SecurityQueryRepository } from '../../repositories/security.queryRepository'
import { SecurityRepository } from '../../repositories/security.repository'
import { TerminateAllDeviceRefreshTokensApartThisUseCase } from './use-cases/terminateAllDeviceRefreshTokensApartThisUseCase'
import { TerminateSpecifiedDeviceRefreshTokenUseCase } from './use-cases/terminateSpecifiedDeviceRefreshTokenUseCase'

const useCases = [
	TerminateAllDeviceRefreshTokensApartThisUseCase,
	TerminateSpecifiedDeviceRefreshTokenUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([User, DeviceToken])],
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
