import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, ILike, Repository } from 'typeorm'
import { User } from '../db/pg/entities/user'
import { GetUsersQueries } from '../models/users/users.input.model'
import { GetUserOutModel, GetUsersOutModel, UserOutModel } from '../models/users/users.output.model'

@Injectable()
export class UsersQueryRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(User) private readonly usersTypeORM: Repository<User>,
	) {}

	async getUsers(query: GetUsersQueries): Promise<GetUsersOutModel> {
		const login = query.searchLoginTerm ?? ''
		const email = query.searchEmailTerm ?? ''

		const sortBy = query.sortBy ?? '"createdAt"'
		const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalUsersCount = await this.usersTypeORM
			.createQueryBuilder()
			.where({ login: ILike(`%${login}%`) })
			.orWhere({ email: ILike(`%${email}%`) })
			.getCount()

		const pagesCount = Math.ceil(totalUsersCount / pageSize)

		const users = await this.usersTypeORM
			.createQueryBuilder()
			.where({ login: ILike(`%${login}%`) })
			.orWhere({ email: ILike(`%${email}%`) })
			.orderBy(sortBy, sortDirection)
			.skip((pageNumber - 1) * pageSize)
			.take(pageSize)
			.getMany()

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalUsersCount,
			items: users.map(this.mapDbUserToOutputUser),
		}
	}

	async getUser(userId: string): Promise<null | GetUserOutModel> {
		const user = await this.dataSource.getRepository(User).findOneBy({ id: userId })
		if (!user) return null

		return this.mapDbUserToOutputUser(user)
	}

	mapDbUserToOutputUser(DbUser: User): UserOutModel {
		return {
			id: DbUser.id.toString(),
			email: DbUser.email,
			login: DbUser.login,
			createdAt: DbUser.createdAt,
		}
	}
}
