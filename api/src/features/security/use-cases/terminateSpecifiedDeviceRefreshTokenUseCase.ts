import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthRepository } from '../../auth/auth.repository'
import { SecurityRepository } from '../security.repository'

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
				code: LayerResultCode.NotFound,
			}
		}

		// Device for deletion exists. Check if current user belongs the device for deletion

		const currentUserDeviceId =
			this.jwtService.getRefreshTokenDataFromTokenStr(currentDeviceTokenStr)?.deviceId

		if (!currentUserDeviceId) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		const userDevices = await this.authRepository.getUserDevicesByDeviceId(currentUserDeviceId)

		if (userDevices.code !== LayerResultCode.Success || !userDevices.data) {
			return {
				code: LayerResultCode.Forbidden,
			}
		}

		const deletionDeviceInUserDevices = userDevices.data.find((userDevice) => {
			return userDevice.deviceId === deletionDeviceId
		})

		if (!deletionDeviceInUserDevices) {
			return {
				code: LayerResultCode.Forbidden,
			}
		}

		const isDeviceDeleted =
			await this.securityRepository.deleteRefreshTokenByDeviceId(deletionDeviceId)

		return {
			code: isDeviceDeleted ? LayerResultCode.Success : LayerResultCode.Forbidden,
		}
	}
}
