import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { JwtService } from '../../base/application/jwt.service'
import { UsersRepository } from '../../repositories/users.repository'

@Injectable()
export class SetReqUserMiddleware implements NestMiddleware {
	constructor(
		private jwtService: JwtService,
		private usersRepository: UsersRepository,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		const authorizationHeader = req.headers['authorization']
		if (!authorizationHeader) {
			next()
			return
		}

		const token = getBearerTokenFromStr(authorizationHeader)
		if (!token) {
			next()
			return
		}

		const userId = this.jwtService.getUserIdByAccessTokenStr(token)
		if (!userId) {
			next()
			return
		}

		req.user = await this.usersRepository.getUserById(userId)
		next()
	}
}

function getBearerTokenFromStr(authorizationHeader: string) {
	const [authType, token] = authorizationHeader.split(' ')

	if (authType !== 'Bearer' || !token) {
		return false
	}

	return token
}
