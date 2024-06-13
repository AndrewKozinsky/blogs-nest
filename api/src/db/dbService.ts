import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import dotenv from 'dotenv'
import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Blog } from './mongo/schemas/blog.schema'
import { Comment } from './mongo/schemas/comment.schema'
import { CommentLike } from './mongo/schemas/commentLike.schema'
import { DeviceToken } from './mongo/schemas/deviceToken.schema'
import { Post } from './mongo/schemas/post.schema'
import { PostLike } from './mongo/schemas/postLike.schema'
import { RateLimit } from './mongo/schemas/rateLimit.schema'
import { User } from './mongo/schemas/user.schema'

dotenv.config()

const mongoURI = process.env.MONGO_URL

@Injectable()
export class DbService {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async drop() {
		try {
			const tablesNames = [
				'ratelimites',
				'devicetokens',
				'commentlikes',
				'comments',
				'postlikes',
				'posts',
				'blogs',
				'users',
			]

			let query = ''

			tablesNames.forEach((tableName) => {
				query += `DELETE FROM ${tableName}; `
			})

			await this.dataSource.query(query, [])

			return true
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err.message)
			}

			return false
		}
	}
}
