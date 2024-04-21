import { Module } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { EmailAdapter } from '../../base/adapters/email.adapter'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { BrowserService } from '../../base/application/browser.service'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { EmailManager } from '../../base/managers/email.manager'
import { DeviceToken, DeviceTokenSchema } from '../../db/schemas/deviceToken.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { CommonService } from '../common/common.service'
import { UsersRepository } from '../users/users.repository'
import { UsersService } from '../users/users.service'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import {
	AuthRegistrationDtoModel,
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
