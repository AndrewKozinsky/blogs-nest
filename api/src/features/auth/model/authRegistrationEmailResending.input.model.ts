import { Injectable } from '@nestjs/common'
import {
	IsEmail,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { AuthRepository } from '../auth.repository'

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
class IsEmailExistsValidation implements ValidatorConstraintInterface {
	constructor(private readonly authRepository: AuthRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByEmail(value)

		if (!user || user.emailConfirmation.isConfirmed) {
			throw new Error('Email is already confirmed')
		}

		return true
	}
}

export class AuthRegistrationEmailResendingDtoModel {
	@IsEmail()
	@Validate(IsEmailExistsValidation)
	email: string
}
