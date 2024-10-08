import { BadRequestException, Injectable } from '@nestjs/common'
import {
	IsEmail,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	Validate,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { AuthRepository } from '../../repositories/authRepository/auth.repository'

@ValidatorConstraint({ name: 'login', async: true })
@Injectable()
export class IsLoginExistsValidation implements ValidatorConstraintInterface {
	constructor(private readonly authRepository: AuthRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByLoginOrEmail(value)

		if (user) {
			throw new BadRequestException([{ field: 'login', message: 'Login exists already' }])
		}

		return true
	}
}

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
export class IsEmailExistsValidation implements ValidatorConstraintInterface {
	constructor(private readonly authRepository: AuthRepository) {}

	async validate(value: string): Promise<boolean> {
		const user = await this.authRepository.getUserByLoginOrEmail(value)

		if (user) {
			throw new BadRequestException([{ field: 'email', message: 'Email exists already' }])
		}

		return true
	}
}

@Injectable()
export class AuthRegistrationDtoModel {
	@IsString({ message: 'Login must be a string' })
	@MinLength(3, { message: 'Login is too short' })
	@MaxLength(10, { message: 'Login is too long' })
	@Matches('^[a-zA-Z0-9_-]*$')
	@Validate(IsLoginExistsValidation)
	login: string

	@IsString({ message: 'Password must be a string' })
	@MinLength(6, { message: 'Password is too short' })
	@MaxLength(20, { message: 'Password is too long' })
	password: string

	@IsEmail()
	@Validate(IsEmailExistsValidation)
	email: string
}
