import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Post } from './post'
import { User } from './user'

@Entity()
export class PostLikes {
	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => Post)
	post: Post

	@ManyToOne(() => User)
	user: User

	@Column('varchar')
	status: string

	@Column('varchar')
	addedAt: string
}
