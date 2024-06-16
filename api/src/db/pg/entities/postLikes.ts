import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Post } from './post'
import { User } from './user'

@Entity()
export class PostLikes {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	status: string

	@Column('varchar')
	addedAt: string

	@ManyToOne(() => Post)
	post: Post

	@Column('varchar')
	postId: string

	@ManyToOne(() => User)
	user: User

	@Column('varchar')
	userId: string
}
