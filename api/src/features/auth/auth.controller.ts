import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { CheckAccessTokenGuard } from '../../infrastructure/guards/checkAccessToken.guard'
import { CheckDeviceRefreshTokenGuard } from '../../infrastructure/guards/checkDeviceRefreshToken.guard'
import { config } from '../../settings/config'
import RouteNames from '../../settings/routeNames'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { AuthRepository } from './auth.repository'
import { AuthLoginDtoModel } from './model/authLogin.input.model'
import { AuthRegistrationDtoModel } from './model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from './model/authRegistrationConfirmation.input.model'
import { AuthRegistrationEmailResendingDtoModel } from './model/authRegistrationEmailResending.input.model'
import { AuthNewPasswordDtoModel } from './model/newPassword.input.model'
import { AuthPasswordRecoveryDtoModel } from './model/passwordRecovery.input.model'
import { ConfirmEmailAfterRegistrationUseCase } from './use-cases/confirmEmailAfterRegistration.useCase'
import { GenerateAccessAndRefreshTokensUseCase } from './use-cases/generateAccessAndRefreshTokens.useCase'
import { GetCurrentUserUseCase } from './use-cases/getCurrentUser.useCase'
import { LoginUseCase } from './use-cases/login.useCase'
import { LogoutUseCase } from './use-cases/logout.useCase'
import { RecoveryPasswordUseCase } from './use-cases/recoveryPassword.useCase'
import { RegistrationUseCase } from './use-cases/registration.useCase'
import { RegistrationEmailResendingUseCase } from './use-cases/registrationEmailResending.useCase'
import { SetNewPasswordUseCase } from './use-cases/setNewPassword.useCase'

@Controller(RouteNames.AUTH.value)
export class AuthController {
	constructor(
		private jwtService: JwtService,
		private requestService: RequestService,
		private setNewPasswordUseCase: SetNewPasswordUseCase,
		private loginUseCase: LoginUseCase,
		private generateAccessAndRefreshTokensUseCase: GenerateAccessAndRefreshTokensUseCase,
		private registrationUseCase: RegistrationUseCase,
		private registrationEmailResendingUseCase: RegistrationEmailResendingUseCase,
		private confirmEmailAfterRegistrationUseCase: ConfirmEmailAfterRegistrationUseCase,
		private getCurrentUserUseCase: GetCurrentUserUseCase,
		private logoutUseCase: LogoutUseCase,
		private recoveryPasswordUseCase: RecoveryPasswordUseCase,
	) {}

	// User login
	@Post(RouteNames.AUTH.LOGIN.value)
	@HttpCode(HttpStatus.OK)
	async login(@Req() req: Request, @Res() res: Response, @Body() body: AuthLoginDtoModel) {
		const loginServiceRes = await this.loginUseCase.execute(req, body)

		if (loginServiceRes.code === LayerResultCode.Unauthorized || !loginServiceRes.data) {
			throw new UnauthorizedException()
		}

		res.cookie(config.refreshToken.name, loginServiceRes.data.refreshTokenStr, {
			maxAge: config.refreshToken.lifeDurationInMs,
			httpOnly: true,
			secure: true,
		})

		res.status(HttpStatus.OK).send({
			accessToken: this.jwtService.createAccessTokenStr(loginServiceRes.data.user.id),
		})
	}

	// Generate the new pair of access and refresh tokens
	// (in cookie client must send correct refreshToken that will be revoked after refreshing)
	@Post(RouteNames.AUTH.REFRESH_TOKEN.value)
	async refreshToken(@Req() req: Request, @Res() res: Response) {
		const generateTokensRes = await this.generateAccessAndRefreshTokensUseCase.execute(req)

		if (generateTokensRes.code === LayerResultCode.Unauthorized) {
			throw new UnauthorizedException()
		}

		const { newAccessToken, newRefreshToken } = generateTokensRes.data!

		res.cookie(config.refreshToken.name, newRefreshToken, {
			// maxAge: config.refreshToken.lifeDurationInMs,
			httpOnly: true,
			secure: true,
		})

		res.status(HttpStatus.OK).send({
			accessToken: newAccessToken,
		})
	}

	// Registration in the system.
	// Email with confirmation code will be sent to passed email address.
	@Post(RouteNames.AUTH.REGISTRATION.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async registration(@Body() body: AuthRegistrationDtoModel) {
		const regStatus = await this.registrationUseCase.execute(body)

		if (regStatus.code === LayerResultCode.BadRequest) {
			throw new BadRequestException()
		}
	}

	// Registration email resending.
	@Post(RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async registrationEmailResending(@Body() body: AuthRegistrationEmailResendingDtoModel) {
		const resendingStatus = await this.registrationEmailResendingUseCase.execute(body)

		if (resendingStatus.code === LayerResultCode.BadRequest) {
			throw new BadRequestException()
		}
	}

	// Confirm registration
	@Post(RouteNames.AUTH.REGISTRATION_CONFIRMATION.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async registrationConfirmation(@Body() body: AuthRegistrationConfirmationDtoModel) {
		const confirmationStatus: LayerResult<null> =
			await this.confirmEmailAfterRegistrationUseCase.execute(body.code)

		if (confirmationStatus.code === LayerResultCode.BadRequest) {
			throw new BadRequestException()
		}
	}

	// Get information about current user
	@UseGuards(CheckAccessTokenGuard)
	@Get(RouteNames.AUTH.ME.value)
	@HttpCode(HttpStatus.OK)
	async getInformationAboutCurrentUser(@Req() req: Request) {
		return await this.getCurrentUserUseCase.execute(req.user!)
	}

	// In cookie client must send correct refreshToken that will be revoked
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Post(RouteNames.AUTH.LOGOUT.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async logout(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)

		const logoutServiceRes = await this.logoutUseCase.execute(refreshTokenFromCookie)

		if (logoutServiceRes.code === LayerResultCode.Unauthorized) {
			throw new UnauthorizedException()
		}

		res.clearCookie(config.refreshToken.name)
		res.sendStatus(HttpStatus.NO_CONTENT)
	}

	// Password recovery via Email confirmation. Email should be sent with RecoveryCode inside
	@Post(RouteNames.AUTH.PASSWORD_RECOVERY.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async passwordRecovery(@Body() body: AuthPasswordRecoveryDtoModel) {
		const passwordRecoveryServiceRes = await this.recoveryPasswordUseCase.execute(body.email)

		if (passwordRecoveryServiceRes.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		// 204 Even if current email is not registered (for prevent user's email detection)
	}

	// Confirm Password recovery
	@Post(RouteNames.AUTH.NEW_PASSWORD.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async newPassword(@Body() body: AuthNewPasswordDtoModel) {
		const passwordRecoveryServiceRes = await this.setNewPasswordUseCase.execute(
			body.recoveryCode,
			body.newPassword,
		)

		if (passwordRecoveryServiceRes.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		// 204 Even if current email is not registered (for prevent user's email detection)
	}
}
