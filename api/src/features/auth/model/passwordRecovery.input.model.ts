import { IsEmail, IsString } from 'class-validator'

export class AuthPasswordRecoveryDtoModel {
	@IsString({ message: 'Email must be a string' })
	@IsEmail()
	email: string
}
