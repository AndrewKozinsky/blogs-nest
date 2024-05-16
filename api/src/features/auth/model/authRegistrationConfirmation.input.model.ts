import { BadRequestException, Injectable } from '@nestjs/common'
import {
	IsString,
	MaxLength,
	MinLength,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { AuthMongoRepository } from '../auth.mongo.repository'

@ValidatorConstraint({ name: 'code', async: true })
@Injectable()
export class CodeCustomValidation implements ValidatorConstraintInterface {
	constructor(private readonly authMongoRepository: AuthMongoRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authMongoRepository.getUserByConfirmationCode(value)

		if (user?.emailConfirmation.isConfirmed) {
			throw new BadRequestException([{ field: 'code', message: 'Email exists already' }])
		}

		if (!user) {
			throw new BadRequestException([
				{ field: 'code', message: 'Confirmation code is not exists' },
			])
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
