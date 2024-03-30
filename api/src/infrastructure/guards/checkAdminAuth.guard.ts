import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class CheckAdminAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest()

		return request.headers['authorization'] === getCorrectAuthorizationHeader()
	}
}

function getCorrectAuthorizationHeader() {
	const base64LoginAndPassword = Buffer.from(
		process.env.AUTH_LOGIN + ':' + process.env.AUTH_PASSWORD,
	).toString('base64')

	return 'Basic ' + base64LoginAndPassword
}
