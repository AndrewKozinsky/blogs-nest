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

	@Column('varchar', { nullable: true })
	passwordRecoveryCode: string

	@Column('varchar')
	createdAt: string

	@Column('varchar', { nullable: true })
	emailConfirmationCode: string

	@Column('varchar', { nullable: true })
	confirmationCodeExpirationDate: string

	@Column('boolean')
	isConfirmationEmailCodeConfirmed: boolean
}
