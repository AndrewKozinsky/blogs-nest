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
import { SecurityMongoQueryRepository } from './security.mongo.queryRepository'
import { TerminateAllDeviceRefreshTokensApartThisUseCase } from './use-cases/terminateAllDeviceRefreshTokensApartThisUseCase'
import { TerminateSpecifiedDeviceRefreshTokenUseCase } from './use-cases/terminateSpecifiedDeviceRefreshTokenUseCase'

@Controller(RouteNames.SECURITY.value)
export class SecurityController {
	constructor(
		private requestService: RequestService,
		private securityQueryRepository: SecurityMongoQueryRepository,
		private terminateAllDeviceRefreshTokensApartThisUseCase: TerminateAllDeviceRefreshTokensApartThisUseCase,
		private terminateSpecifiedDeviceRefreshTokenUseCase: TerminateSpecifiedDeviceRefreshTokenUseCase,
	) {}

	// Returns all devices with active sessions for current user
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Get('devices')
	async getUserDevices(@Req() req: Request, @Res() res: Response) {
		const refreshTokenFromCookie = this.requestService.getRefreshTokenStrFromReq(req) as string

		const userDevices =
			await this.securityQueryRepository.getUserDevices(refreshTokenFromCookie)

		res.status(HttpStatus.OK).send(userDevices)
	}

	// Terminate all other (exclude current) device's sessions
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Delete('devices')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevicesExceptOne(@Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getRefreshTokenStrFromReq(req)
		if (!refreshTokenFromCookie) return

		await this.terminateAllDeviceRefreshTokensApartThisUseCase.execute(refreshTokenFromCookie)
	}

	// Terminate specified device session
	@UseGuards(CheckDeviceRefreshTokenGuard)
	@Delete('devices/:deviceId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async terminateUserDevice(@Param('deviceId') deviceId: string, @Req() req: Request) {
		const refreshTokenFromCookie = this.requestService.getRefreshTokenStrFromReq(req)
		if (!refreshTokenFromCookie) {
			throw new ForbiddenException()
		}

		const terminateDeviceRes = await this.terminateSpecifiedDeviceRefreshTokenUseCase.execute(
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
