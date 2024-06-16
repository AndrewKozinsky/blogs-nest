import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	login: string

	@Column('varchar')
	email: string

	@Column('varchar')
	password: string

	@Column('varchar')
	passwordRecoveryCode: string

	@Column('varchar')
	createdAt: string

	@Column('varchar')
	emailConfirmationCode: string

	@Column('varchar')
	confirmationCodeExpirationDate: string

	@Column('varchar')
	isConfirmationEmailCodeConfirmed: boolean
}
