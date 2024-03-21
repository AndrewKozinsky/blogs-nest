import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { JwtService } from '../../application/jwt.service'
import { RequestService } from '../../application/request.service'
import { config } from '../../config/config'
import RouteNames from '../../config/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { AuthService } from './auth.service'
import { AuthLoginDtoModel } from './model/authLogin.input.model'
import { AuthRegistrationDtoModel } from './model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from './model/authRegistrationConfirmation.input.model'
import { AuthRegistrationEmailResendingDtoModel } from './model/authRegistrationEmailResending.input.model'
import { AuthNewPasswordDtoModel } from './model/newPassword.input.model'
import { AuthPasswordRecoveryDtoModel } from './model/passwordRecovery.input.model'

@Controller(RouteNames.auth)
export class AuthController {
	constructor(
		private authService: AuthService,
		private jwtService: JwtService,
		private requestService: RequestService,
	) {}

	@Post('/login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() body: AuthLoginDtoModel, @Res() res: Response, @Req() req: Request) {
		const loginServiceRes = await this.authService.login(req)

		if (loginServiceRes.code === LayerResultCode.Unauthorized || !loginServiceRes.data) {
			res.sendStatus(HttpStatus.UNAUTHORIZED)
			return
		}

		res.cookie(config.refreshToken.name, loginServiceRes.data.refreshTokenStr, {
			maxAge: config.refreshToken.lifeDurationInMs,
			httpOnly: true,
			secure: true,
		})

		return {
			accessToken: this.jwtService.createAccessTokenStr(loginServiceRes.data.user.id),
		}
	}

	// Generate the new pair of access and refresh tokens (in cookie client must send correct refreshToken that will be revoked after refreshing)
	@Post('/refresh-token')
	@HttpCode(HttpStatus.OK)
	async refreshToken(@Req() req: Request, @Res() res: Response) {
		const generateTokensRes = await this.authService.refreshToken(req)

		if (generateTokensRes.code === LayerResultCode.Unauthorized) {
			res.sendStatus(HttpStatus.UNAUTHORIZED)
			return
		}

		const { newAccessToken, newRefreshToken } = generateTokensRes.data!

		res.cookie(config.refreshToken.name, newRefreshToken, {
			maxAge: config.refreshToken.lifeDurationInMs,
			httpOnly: true,
			secure: true,
		})

		return {
			accessToken: newAccessToken,
		}
	}

	// Registration in the system.
	// Email with confirmation code will be sent to passed email address.
	@Post('/registration')
	@HttpCode(HttpStatus.NO_CONTENT)
	async registration(@Body() body: AuthRegistrationDtoModel, @Res() res: Response) {
		const regStatus = await this.authService.registration(body)

		if (regStatus.code === LayerResultCode.BadRequest) {
			res.sendStatus(HttpStatus.BAD_REQUEST)
			return
		}

		return
	}

	// ---

	// Registration email resending.
	@Post('registration-email-resending')
	@HttpCode(HttpStatus.NO_CONTENT)
	async registrationEmailResending(
		@Body() body: AuthRegistrationEmailResendingDtoModel,
		@Res() res: Response,
	) {
		const resendingStatus = await this.authService.resendEmailConfirmationCode(body)

		if (resendingStatus.code === LayerResultCode.BadRequest) {
			res.sendStatus(HttpStatus.BAD_REQUEST)
			return
		}

		return
	}

	@Post('registration-confirmation')
	@HttpCode(HttpStatus.NO_CONTENT)
	async registrationConfirmation(
		@Body() body: AuthRegistrationConfirmationDtoModel,
		@Res() res: Response,
	) {
		const confirmationStatus = await this.authService.confirmEmail(body.code)

		if (confirmationStatus.status === 'fail') {
			res.sendStatus(HttpStatus.BAD_REQUEST)
			return
		}

		return
	}

	@Get('me')
	@HttpCode(HttpStatus.OK)
	async getInformationAboutCurrentUser(@Req() req: Request, @Res() res: Response) {
		const user = this.authService.getCurrentUser(req.user!)
		return user
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	async logout(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		const logoutServiceRes = await this.authService.logout(refreshTokenFromCookie)

		if (logoutServiceRes.code === LayerResultCode.Unauthorized) {
			res.sendStatus(HttpStatus.UNAUTHORIZED)
			return
		}

		res.clearCookie(config.refreshToken.name)
		return
	}

	// Password recovery via Email confirmation. Email should be sent with RecoveryCode inside
	@Post('password-recovery')
	@HttpCode(HttpStatus.NO_CONTENT)
	async passwordRecovery(@Body() body: AuthPasswordRecoveryDtoModel, @Res() res: Response) {
		const passwordRecoveryServiceRes = await this.authService.passwordRecovery(body.email)

		if (passwordRecoveryServiceRes.code !== LayerResultCode.Success) {
			res.sendStatus(HttpStatus.BAD_REQUEST)
			return
		}

		// 204 Even if current email is not registered (for prevent user's email detection)
		return
	}

	// Confirm Password recovery
	@Post('new-password')
	@HttpCode(HttpStatus.NO_CONTENT)
	async newPassword(@Body() body: AuthNewPasswordDtoModel, @Res() res: Response) {
		const passwordRecoveryServiceRes = await this.authService.newPassword(
			body.recoveryCode,
			body.newPassword,
		)

		if (passwordRecoveryServiceRes.code !== LayerResultCode.Success) {
			res.sendStatus(HttpStatus.BAD_REQUEST)
			return
		}

		// 204 Even if current email is not registered (for prevent user's email detection)
		return
	}
}
