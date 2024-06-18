import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, ILike, Repository } from 'typeorm'
import { User } from '../../db/pg/entities/user'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../utils/numbers'
import { GetUsersQueries } from './models/users.input.model'
import { GetUserOutModel, GetUsersOutModel, UserOutModel } from './models/users.output.model'

@Injectable()
export class UsersQueryRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(User) private readonly usersTypeORM: Repository<User>,
	) {}

	async getUsers(query: GetUsersQueries): Promise<GetUsersOutModel> {
		const login = query.searchLoginTerm ?? ''
		const email = query.searchEmailTerm ?? ''

		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalUsersCount = await this.usersTypeORM
			.createQueryBuilder()
			.where([{ login: ILike(`%${login}%`) }, { email: ILike(`%${email}%`) }])
			.getCount()

		const pagesCount = Math.ceil(totalUsersCount / pageSize)

		const users = await this.usersTypeORM.find({
			where: [{ login: ILike(`%${login}%`) }, { email: ILike(`%${email}%`) }],
			order: {
				[sortBy]: sortDirection,
			},
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
		})

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalUsersCount,
			items: users.map(this.mapDbUserToOutputUser),
		}
	}

	/*async getUsersNative(query: GetUsersQueries): Promise<GetUsersOutModel> {
		const login = query.searchLoginTerm ?? ''
		const email = query.searchEmailTerm ?? ''

		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const usersCountRes = await this.dataSource.query(
			`SELECT COUNT(*) FROM users WHERE login ILIKE '%${login}%' OR email ILIKE '%${email}%'`,
			[],
		) // [ { count: '18' } ]
		const totalUsersCount = +usersCountRes[0].count
		const pagesCount = Math.ceil(totalUsersCount / pageSize)

		const getUsersRes = await this.dataSource.query(
			`SELECT * FROM users
					WHERE login ILIKE '%${login}%' OR email ILIKE '%${email}%'
					ORDER BY ${sortBy} COLLATE "C" ${sortDirection}
					LIMIT ${pageSize}
					OFFSET ${(pageNumber - 1) * pageSize}`,
			[],
		)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalUsersCount,
			items: getUsersRes.map(this.mapDbUserToOutputUser),
		}
	}*/

	async getUser(userId: string): Promise<null | GetUserOutModel> {
		const user = await this.dataSource.getRepository(User).findOneBy({ id: userId })

		if (!user) {
			return null
		}

		return this.mapDbUserToOutputUser(user)
	}

	/*async getUserNative(userId: string): Promise<null | GetUserOutModel> {
		const userIdNum = convertToNumber(userId)
		if (!userIdNum) {
			return null
		}

		const usersRes = await this.dataSource.query(`SELECT * FROM users WHERE id=${userId}`, [])

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToOutputUser(usersRes[0])
	}*/

	mapDbUserToOutputUser(DbUser: User): UserOutModel {
		return {
			id: DbUser.id.toString(),
			email: DbUser.email,
			login: DbUser.login,
			createdAt: DbUser.createdAt,
		}
	}
}
