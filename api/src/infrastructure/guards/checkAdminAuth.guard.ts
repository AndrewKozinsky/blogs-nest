import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { loginRequest } from '../../../test/utils/utils'

@Injectable()
export class CheckAdminAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest()

		const isRequestAllowed =
			request.headers['authorization'] === getCorrectAuthorizationHeader()

		if (!isRequestAllowed) {
			throw new UnauthorizedException()
		}

		return true
	}
}

function getCorrectAuthorizationHeader() {
	const base64LoginAndPassword = Buffer.from(
		process.env.AUTH_LOGIN + ':' + process.env.AUTH_PASSWORD,
	).toString('base64')

	return 'Basic ' + base64LoginAndPassword
}
