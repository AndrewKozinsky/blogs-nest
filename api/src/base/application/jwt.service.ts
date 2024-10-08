import { Injectable } from '@nestjs/common'
import { add, addMilliseconds } from 'date-fns'
import jwt, { decode } from 'jsonwebtoken'
import { DeviceTokenOutModel } from '../../models/auth/auth.output.model'
import { config } from '../../settings/config'
import { createUniqString } from '../../utils/stringUtils'

@Injectable()
export class JwtService {
	createAccessTokenStr(userId: string) {
		return jwt.sign({ userId }, config.JWT_SECRET, {
			expiresIn: config.accessToken.lifeDurationInMs / 1000 + 's',
		})
	}

	createRefreshTokenStr(deviceId: string, expirationDate?: Date): string {
		const defaultExpDate = add(new Date(), {
			seconds: config.refreshToken.lifeDurationInMs / 1000,
		})

		const expDate = expirationDate || defaultExpDate

		return jwt.sign({ deviceId }, config.JWT_SECRET, {
			expiresIn: (+expDate - +new Date()) / 1000 + 's',
		})
	}

	createDeviceRefreshToken(
		userId: string,
		deviceIP: string,
		deviceName: string,
	): DeviceTokenOutModel {
		const deviceId = createUniqString()

		return {
			issuedAt: new Date(),
			expirationDate: addMilliseconds(new Date(), config.refreshToken.lifeDurationInMs),
			deviceIP,
			deviceId,
			deviceName,
			userId,
		}
	}

	getPayload(tokenStr: string) {
		return jwt.decode(tokenStr, { complete: true })!.payload
	}

	getUserIdByAccessTokenStr(accessToken: string): null | string {
		try {
			const result: any = jwt.verify(accessToken, config.JWT_SECRET)
			return result.userId
		} catch (error) {
			return null
		}
	}

	getRefreshTokenDataFromTokenStr(refreshTokenStr: string) {
		try {
			const payload = jwt.verify(refreshTokenStr, config.JWT_SECRET)
			return payload as { deviceId: string }
		} catch (error) {
			console.log(error)
			return null
		}
	}

	// Check if token string is valid
	isRefreshTokenStrValid(refreshTokenStr: string = '') {
		try {
			const tokenPayload = jwt.verify(refreshTokenStr, config.JWT_SECRET)
			return true
		} catch (error) {
			console.log(error)
			return false
		}
	}

	getTokenStrExpirationDate(tokenStr: string): null | Date {
		try {
			const tokenPayload = decode(tokenStr)

			if (!tokenPayload || typeof tokenPayload === 'string') {
				return null
			}

			// @ts-ignore
			return new Date(tokenPayload.exp * 1000)
		} catch (error) {
			console.log(error)
			return null
		}
	}
}
