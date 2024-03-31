import { Injectable } from '@nestjs/common'
import {
	IsString,
	MaxLength,
	MinLength,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { AuthRepository } from '../auth.repository'

@ValidatorConstraint({ name: 'recoveryCode', async: true })
@Injectable()
export class IsRecoveryCodeExistsValidation implements ValidatorConstraintInterface {
	constructor(private readonly authRepository: AuthRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByLoginOrEmail(value)

		if (!user) {
			throw new Error('Recovery code is not correct')
		}

		return true
	}
}

export class AuthNewPasswordDtoModel {
	@IsString({ message: 'New password must be a string' })
	@MinLength(6, { message: 'New password is too short' })
	@MaxLength(20, { message: 'New password is too long' })
	newPassword: string

	@IsString()
	@Validate(IsRecoveryCodeExistsValidation)
	recoveryCode: string
}
