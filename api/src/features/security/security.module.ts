import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { User } from '../../db/pg/entities/user'
import { AuthRepository } from '../auth/authRepository'
import { CommonService } from '../common/common.service'
import { SecurityController } from './security.controller'
import { SecurityQueryRepository } from './securityQueryRepository'
import { SecurityRepository } from './securityRepository'
import { TerminateAllDeviceRefreshTokensApartThisUseCase } from './use-cases/terminateAllDeviceRefreshTokensApartThisUseCase'
import { TerminateSpecifiedDeviceRefreshTokenUseCase } from './use-cases/terminateSpecifiedDeviceRefreshTokenUseCase'

const useCases = [
	TerminateAllDeviceRefreshTokensApartThisUseCase,
	TerminateSpecifiedDeviceRefreshTokenUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([User])],
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
