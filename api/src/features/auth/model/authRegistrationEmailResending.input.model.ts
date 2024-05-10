import { BadRequestException, Injectable } from '@nestjs/common'
import {
	IsEmail,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { AuthMongoRepository } from '../auth.mongo.repository'

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
export class IsEmailExistsValidationInAuthRegistrationEmailResendingDto
	implements ValidatorConstraintInterface
{
	constructor(private readonly authRepository: AuthMongoRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByEmail(value)

		if (!user || user.emailConfirmation.isConfirmed) {
			throw new BadRequestException([
				{ field: 'email', message: 'Email is already confirmed' },
			])
		}

		return true
	}
}

export class AuthRegistrationEmailResendingDtoModel {
	@IsEmail()
	@Validate(IsEmailExistsValidationInAuthRegistrationEmailResendingDto)
	email: string
}
