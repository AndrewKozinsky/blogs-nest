import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class CheckAccessTokenGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest()

		const isRequestAllowed = !!request.user

		if (!isRequestAllowed) {
			throw new UnauthorizedException()
		}

		return true
	}
}
