import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import {
	IsEmail,
	IsIn,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'

export class CreateUserDtoModel {
	@IsString({ message: 'Login must be a string' })
	@MinLength(3, { message: 'Login is too short' })
	@MaxLength(10, { message: 'Login is too long' })
	@Matches('^[a-zA-Z0-9_-]*$', 'Incorrect login')
	login: string

	@IsString({ message: 'Password must be a string' })
	@MinLength(6, { message: 'Password is too short' })
	@MaxLength(20, { message: 'Password is too long' })
	password: string

	@IsString({ message: 'Email must be a string' })
	@IsEmail()
	email: string
}

export class GetUsersQueries {
	@IsOptional()
	@IsString({ message: 'SortBy must be a string' })
	// Default value : createdAt
	sortBy?: string

	@IsOptional()
	@IsIn(['desc', 'asc'])
	// Default value: desc. Available values : asc, desc
	sortDirection?: 'desc' | 'asc'

	@IsOptional()
	@IsInt()
	@Min(1)
	// pageNumber is number of portions that should be returned. Default value : 1
	pageNumber?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	// pageSize is portions size that should be returned. Default value : 10
	pageSize?: number

	@IsOptional()
	@IsString({ message: 'SearchLoginTerm must be a string' })
	// Search term for user Login: Login should contains this term in any position
	searchLoginTerm?: string

	@IsOptional()
	@IsString({ message: 'SearchEmailTerm must be a string' })
	// Search term for user Email: Email should contains this term in any position
	searchEmailTerm?: string
}

@Injectable()
export class GetUsersQueriesPipe implements PipeTransform {
	async transform(dto: GetUsersQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}
