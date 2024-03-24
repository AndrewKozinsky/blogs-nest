import { Controller, Delete, Get, HttpStatus, Param, Req, Res } from '@nestjs/common'
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
	async getUserDevices(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)

		const userDevices =
			await this.securityQueryRepository.getUserDevices(refreshTokenFromCookie)

		res.status(HttpStatus.OK).send(userDevices)
	}

	// Terminate all other (exclude current) device's sessions
	@Delete('devices')
	async terminateUserDevicesExceptOne(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getDeviceRefreshStrTokenFromReq(req)
		await this.securityService.terminateAllDeviceRefreshTokensApartThis(refreshTokenFromCookie)

		res.sendStatus(HttpStatus.NO_CONTENT)
	}

	// Terminate specified device session
	@Delete('devices/:deviceId')
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

		res.sendStatus(HttpStatus.NO_CONTENT)
	}
}
