import { IsString, MaxLength, MinLength } from 'class-validator'

export class AuthLoginDtoModel {
	@IsString({ message: 'LoginOrEmail must be a string' })
	@MinLength(1, { message: 'LoginOrEmail is too short' })
	@MaxLength(30, { message: 'LoginOrEmail is too long' })
	loginOrEmail: string

	@IsString({ message: 'Password must be a string' })
	@MinLength(1, { message: 'Password is too short' })
	@MaxLength(30, { message: 'Password is too long' })
	password: string
}
