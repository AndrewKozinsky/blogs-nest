import { Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './user'

export class DeviceToken {
	@PrimaryGeneratedColumn()
	id: number

	@Column('varchar')
	issuedAt: string

	@ManyToOne(() => User, (u) => u.id)
	user: User

	@Column('varchar')
	expirationDate: string

	@Column('varchar')
	deviceIP: string

	@Column('varchar')
	deviceId: string

	@Column('varchar')
	deviceName: string
}
