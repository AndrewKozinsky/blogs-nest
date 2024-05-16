import { BadRequestException, Injectable } from '@nestjs/common'
import {
	IsString,
	MaxLength,
	MinLength,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { UsersMongoRepository } from '../../users/users.mongo.repository'

@ValidatorConstraint({ name: 'recoveryCode', async: true })
@Injectable()
export class IsRecoveryCodeExistsValidation implements ValidatorConstraintInterface {
	constructor(private readonly usersMongoRepository: UsersMongoRepository) {}

	async validate(recoveryCode: string): Promise<boolean> {
		const user = await this.usersMongoRepository.getUserByPasswordRecoveryCode(recoveryCode)

		if (!user) {
			throw new BadRequestException([
				{ field: 'recoveryCode', value: 'Recovery code is not correct' },
			])
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
