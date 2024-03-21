import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { DBTypes } from '../../db/dbTypes'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { BlogsRepository } from '../blogs/blogs.repository'
import { CommentsRepository } from '../comments/comments.repository'
import { CommonService } from '../common/common.service'
import { PostLikesRepository } from '../postLikes/postLikes.repository'
import { UserServiceModel } from '../users/models/users.service.model'
import { CreateUserDtoModel } from './models/users.input.model'
import { UsersRepository } from './users.repository'
// import { CreatePostDtoModel } from '../../posts/model/posts.input.model'
// import { BlogsQueryRepository } from './blogs.queryRepository'
// import { BlogsRepository } from './blogs.repository'
// import { CreateBlogDtoModel, CreateBlogPostDtoModel } from './model/blogs.input.model'
// import { CreateBlogOutModel } from './model/blogs.output.model'

@Injectable()
export class UsersService {
	constructor(
		private usersRepository: UsersRepository,
		private commonService: CommonService,
	) {}

	/*async getUser(userId: string) {
		return this.usersRepository.getUserById(userId)
	}*/

	async createUserByAdmin(dto: CreateUserDtoModel) {
		const newUserDto = await this.commonService.getCreateUserDto(dto, true)
		return this.usersRepository.createUser(newUserDto)
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.usersRepository.deleteUser(userId)
	}
}
