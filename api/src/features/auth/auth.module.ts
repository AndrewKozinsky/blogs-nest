import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmailAdapter } from '../../base/adapters/email.adapter'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { BrowserService } from '../../base/application/browser.service'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { EmailManager } from '../../base/managers/email.manager'
import { Blog } from '../../db/pg/entities/blog'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { Post } from '../../db/pg/entities/post'
import { User } from '../../db/pg/entities/user'
import { CommonService } from '../common/common.service'
import { UsersRepository } from '../users/usersRepository'
import { UsersService } from '../users/users.service'
import { AuthRepository } from './authRepository'
import { AuthController } from './auth.controller'
import {
	IsEmailExistsValidation,
	IsLoginExistsValidation,
} from './model/authRegistration.input.model'
import { CodeCustomValidation } from './model/authRegistrationConfirmation.input.model'
import { IsEmailExistsValidationInAuthRegistrationEmailResendingDto } from './model/authRegistrationEmailResending.input.model'
import { IsRecoveryCodeExistsValidation } from './model/newPassword.input.model'
import { ConfirmEmailAfterRegistrationUseCase } from './use-cases/confirmEmailAfterRegistration.useCase'
import { GenerateAccessAndRefreshTokensUseCase } from './use-cases/generateAccessAndRefreshTokens.useCase'
import { GetCurrentUserUseCase } from './use-cases/getCurrentUser.useCase'
import { LoginUseCase } from './use-cases/login.useCase'
import { LogoutUseCase } from './use-cases/logout.useCase'
import { RecoveryPasswordUseCase } from './use-cases/recoveryPassword.useCase'
import { RegistrationUseCase } from './use-cases/registration.useCase'
import { RegistrationEmailResendingUseCase } from './use-cases/registrationEmailResending.useCase'
import { SetNewPasswordUseCase } from './use-cases/setNewPassword.useCase'

const useCases = [
	ConfirmEmailAfterRegistrationUseCase,
	GenerateAccessAndRefreshTokensUseCase,
	GetCurrentUserUseCase,
	LoginUseCase,
	LogoutUseCase,
	RecoveryPasswordUseCase,
	RegistrationUseCase,
	RegistrationEmailResendingUseCase,
	SetNewPasswordUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([User, DeviceToken])],
	controllers: [AuthController],
	providers: [
		JwtService,
		CommandBus,
		AuthRepository,
		HashAdapter,
		CommonService,
		RequestService,
		UsersRepository,
		BrowserService,
		EmailManager,
		EmailAdapter,
		UsersService,
		IsLoginExistsValidation,
		IsEmailExistsValidation,
		CodeCustomValidation,
		IsEmailExistsValidationInAuthRegistrationEmailResendingDto,
		IsRecoveryCodeExistsValidation,
		...useCases,
	],
})
export class AuthModule {}
