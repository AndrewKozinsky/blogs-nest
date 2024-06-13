import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm'
import { JoinColumn } from 'typeorm/browser'

@Entity()
/*export class Post {
	@PrimaryGeneratedColumn()
	id: number

	@Column('varchar')
	title: string

	@Column('varchar')
	shortDescription: string

	@Column('text')
	content: string

	@Column('varchar')
	createdAt: string

	// ??
	blogId: boolean
}*/

/*
`CREATE TABLE IF NOT EXISTS posts (
    blogId SERIAL REFERENCES blogs(id)
)`*/

// ---

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	firstName: string

	@Column()
	lastName: string
}

@Entity()
export class Profile {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	address: string

	@Column()
	hobby: string

	@Column()
	dob: Date

	@OneToOne(() => User)
	@JoinColumn()
	user: Profile

	@Column()
	userId: number
}
