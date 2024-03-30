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

@ValidatorConstraint({ name: 'code', async: true })
@Injectable()
class CodeCustomValidation implements ValidatorConstraintInterface {
	constructor(private readonly authRepository: AuthRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByLoginOrEmail(value)

		if (user?.emailConfirmation.isConfirmed) {
			throw new Error('Email exists already')
		}

		if (!user) {
			throw new Error('Confirmation code is not exists')
		}

		return true
	}
}

export class AuthRegistrationConfirmationDtoModel {
	@IsString()
	@MinLength(1, { message: 'Code is too short' })
	@MaxLength(100, { message: 'Code is too long' })
	@Validate(CodeCustomValidation)
	code: string
}
