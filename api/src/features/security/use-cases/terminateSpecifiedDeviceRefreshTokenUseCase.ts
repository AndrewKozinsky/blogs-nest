import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../../auth/authRepository'
import { SecurityRepository } from '../securityRepository'

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
				code: LayerErrorCode.NotFound,
			}
		}

		// Device for deletion exists. Check if current user belongs the device for deletion

		const currentUserDeviceId =
			this.jwtService.getRefreshTokenDataFromTokenStr(currentDeviceTokenStr)?.deviceId

		if (!currentUserDeviceId) {
			return {
				code: LayerErrorCode.Unauthorized,
			}
		}

		const userDevices = await this.authRepository.getUserDevicesByDeviceId(currentUserDeviceId)

		if (userDevices.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.Forbidden,
			}
		}

		const deletionDeviceInUserDevices = userDevices.data.find((userDevice) => {
			return userDevice.deviceId === deletionDeviceId
		})

		if (!deletionDeviceInUserDevices) {
			return {
				code: LayerErrorCode.Forbidden,
			}
		}

		const isDeviceDeleted =
			await this.securityRepository.deleteRefreshTokenByDeviceId(deletionDeviceId)

		return isDeviceDeleted
			? { code: LayerSuccessCode.Success, data: null }
			: { code: LayerErrorCode.Forbidden }
	}
}
