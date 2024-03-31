import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance, Transform, Type } from 'class-transformer'
import {
	IsIn,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
	MinLength,
} from 'class-validator'

export class CreateBlogDtoModel {
	@IsString({ message: 'Name must be a string' })
	@MinLength(1, { message: 'Name is too short' })
	@MaxLength(15, { message: 'Name is too long' })
	name: string

	@IsString({ message: 'Description must be a string' })
	@MinLength(1, { message: 'Description is too short' })
	@MaxLength(500, { message: 'Description is too long' })
	description: string

	@IsString({ message: 'WebsiteUrl must be a string' })
	@IsUrl()
	@MinLength(1, { message: 'WebsiteUrl is too short' })
	@MaxLength(100, { message: 'WebsiteUrl is too long' })
	websiteUrl: string
}

export class CreateBlogPostDtoModel {
	@IsString({ message: 'Title must be a string' })
	@MinLength(1, { message: 'Title is too short' })
	@MaxLength(30, { message: 'Title is too long' })
	title: string

	@IsString({ message: 'ShortDescription must be a string' })
	@MinLength(1, { message: 'ShortDescription is too short' })
	@MaxLength(100, { message: 'ShortDescription is too long' })
	shortDescription: string

	@IsString({ message: 'Content must be a string' })
	@MinLength(1, { message: 'Content is too short' })
	@MaxLength(1000, { message: 'Content is too long' })
	content: string
}

export class UpdateBlogDtoModel {
	@IsString({ message: 'Name must be a string' })
	@MinLength(1, { message: 'Name is too short' })
	@MaxLength(15, { message: 'Name is too long' })
	name: string

	@IsString({ message: 'Description must be a string' })
	@MinLength(1, { message: 'Description is too short' })
	@MaxLength(500, { message: 'Description is too long' })
	description: string

	@IsString({ message: 'WebsiteUrl must be a string' })
	@MinLength(1, { message: 'WebsiteUrl is too short' })
	@MaxLength(100, { message: 'WebsiteUrl is too long' })
	@IsUrl()
	websiteUrl: string
}

export class GetBlogsQueries {
	@IsOptional()
	@IsString({ message: 'SearchNameTerm must be a string' })
	// Search term for blog Name: Name should contain this term in any position
	searchNameTerm?: string

	@IsOptional()
	@IsString({ message: 'SortBy must be a string' })
	// Default value : createdAt
	sortBy?: string

	@IsOptional()
	@IsIn(['desc', 'asc'])
	// Default value: desc. Available values : asc, desc
	sortDirection?: 'desc' | 'asc'

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	// pageNumber is number of portions that should be returned. Default value : 1
	pageNumber?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	// pageSize is portions size that should be returned. Default value : 10
	pageSize?: number
}

@Injectable()
export class GetBlogsQueriesPipe implements PipeTransform {
	async transform(dto: GetBlogsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}

export class GetBlogPostsQueries {
	@IsOptional()
	@IsString()
	// Default value : createdAt
	sortBy?: string

	@IsOptional()
	@IsIn(['desc', 'asc'])
	// Default value: desc. Available values : asc, desc
	sortDirection?: 'desc' | 'asc'

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	// pageNumber is number of portions that should be returned. Default value : 1
	pageNumber?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	// pageSize is portions size that should be returned. Default value : 10
	pageSize?: number
}

@Injectable()
export class GetBlogPostsQueriesPipe implements PipeTransform {
	async transform(dto: GetBlogsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}
