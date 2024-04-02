import { Injectable } from '@nestjs/common'
import { add, addMilliseconds } from 'date-fns'
import jwt, { decode } from 'jsonwebtoken'
import { config } from '../../settings/config'
import { DBTypes } from '../../db/dbTypes'
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
	): DBTypes.DeviceToken {
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

	isRefreshTokenStrValid(refreshTokenStr: string) {
		try {
			jwt.verify(refreshTokenStr, config.JWT_SECRET)
			return true
		} catch (error) {
			console.log(error)
			return false
		}
	}

	getTokenExpirationDate(tokenStr: string): null | Date {
		try {
			const res = decode(tokenStr)
			if (typeof res === 'string' || !res) {
				return null
			}

			return new Date(res.exp! * 1000)
		} catch (error) {
			console.log(error)
			return null
		}
	}
}
