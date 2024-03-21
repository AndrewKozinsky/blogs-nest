import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { RequestService } from '../../application/request.service'
import RouteNames from '../../config/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { SecurityQueryRepository } from './security.queryRepository'
import { SecurityService } from './security.service'

@Controller(RouteNames.security)
export class SecurityController {
	constructor(
		private requestService: RequestService,
		private securityQueryRepository: SecurityQueryRepository,
		private securityService: SecurityService,
	) {}

	// Returns all devices with active sessions for current user
	@Get('devices')
	@HttpCode(HttpStatus.OK)
	async getUserDevices(@Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)

		const userDevices =
			await this.securityQueryRepository.getUserDevices(refreshTokenFromCookie)
		return userDevices
	}

	// Terminate all other (exclude current) device's sessions
	@Delete('devices')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevicesExceptOne(@Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		await this.securityService.terminateAllDeviceRefreshTokensApartThis(refreshTokenFromCookie)
	}

	// Terminate specified device session
	@Delete('devices/:deviceId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevice(
		@Param('deviceId') deviceId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		const terminateDeviceRes = await this.securityService.terminateSpecifiedDeviceRefreshToken(
			refreshTokenFromCookie,
			deviceId,
		)

		if (terminateDeviceRes.code === LayerResultCode.NotFound) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		if (terminateDeviceRes.code === LayerResultCode.Forbidden) {
			res.sendStatus(HttpStatus.FORBIDDEN)
			return
		}
	}
}
