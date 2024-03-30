import {
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { RequestService } from '../../base/application/request.service'
import { CheckDeviceRefreshTokenGuard } from '../../infrastructure/guards/checkDeviceRefreshToken.guard'
import RouteNames from '../../settings/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { SecurityQueryRepository } from './security.queryRepository'
import { SecurityService } from './security.service'

@Controller(RouteNames.SECURITY.value)
export class SecurityController {
	constructor(
		private requestService: RequestService,
		private securityQueryRepository: SecurityQueryRepository,
		private securityService: SecurityService,
	) {}

	// Returns all devices with active sessions for current user
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Get('devices')
	async getUserDevices(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)

		const userDevices =
			await this.securityQueryRepository.getUserDevices(refreshTokenFromCookie)

		res.status(HttpStatus.OK).send(userDevices)
	}

	// Terminate all other (exclude current) device's sessions
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Delete('devices')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevicesExceptOne(@Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		await this.securityService.terminateAllDeviceRefreshTokensApartThis(refreshTokenFromCookie)
	}

	// Terminate specified device session
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Delete('devices/:deviceId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevice(@Param('deviceId') deviceId: string, @Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		const terminateDeviceRes = await this.securityService.terminateSpecifiedDeviceRefreshToken(
			refreshTokenFromCookie,
			deviceId,
		)

		if (terminateDeviceRes.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}

		if (terminateDeviceRes.code === LayerResultCode.Forbidden) {
			throw new ForbiddenException()
		}
	}
}
