import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../../../repositories/authRepository/auth.repository'
import { SecurityRepository } from '../../../repositories/security.repository'

@Injectable()
export class TerminateSpecifiedDeviceRefreshTokenUseCase {
	constructor(
		private jwtService: JwtService,
		private securityRepository: SecurityRepository,
		private authRepository: AuthRepository,
	) {}

	async execute(
		currentDeviceTokenStr: string,
		deletionDeviceId: string,
	): Promise<LayerResult<null>> {
		// Is device for deletion is not exist give NotFound code
		const deviceRefreshToken =
			await this.authRepository.getDeviceRefreshTokenByDeviceId(deletionDeviceId)

		if (!deviceRefreshToken) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		// Device for deletion exists. Check if current user belongs the device for deletion

		const currentUserDeviceId =
			this.jwtService.getRefreshTokenDataFromTokenStr(currentDeviceTokenStr)?.deviceId

		if (!currentUserDeviceId) {
			return {
				code: LayerErrorCode.Unauthorized_401,
			}
		}

		const userDevices = await this.authRepository.getUserDevicesByDeviceId(currentUserDeviceId)

		if (userDevices.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		const deletionDeviceInUserDevices = userDevices.data.find((userDevice) => {
			return userDevice.deviceId === deletionDeviceId
		})

		if (!deletionDeviceInUserDevices) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		const isDeviceDeleted =
			await this.securityRepository.deleteRefreshTokenByDeviceId(deletionDeviceId)

		return isDeviceDeleted
			? { code: LayerSuccessCode.Success, data: null }
			: { code: LayerErrorCode.Forbidden_403 }
	}
}
