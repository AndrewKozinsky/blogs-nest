import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './user'

@Entity()
export class DeviceToken {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	issuedAt: string

	@Column('varchar')
	expirationDate: string

	@Column('varchar')
	deviceIP: string

	@Column('varchar')
	deviceId: string

	@Column('varchar')
	deviceName: string

	@ManyToOne(() => User, (u) => u.id)
	user: User

	@Column('varchar')
	userId: string
}
