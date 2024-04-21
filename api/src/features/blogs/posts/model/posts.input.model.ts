import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance, Type } from 'class-transformer'
import {
	IsIn,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength,
	Validate,
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'
import { Trim } from '../../../../infrastructure/pipes/Trim.decorator'
import { BlogsRepository } from '../../blogs/blogs.repository'
import { GetBlogsQueries } from '../../blogs/model/blogs.input.model'

@ValidatorConstraint({ name: 'blogId', async: true })
@Injectable()
export class BlogIdValidation implements ValidatorConstraintInterface {
	constructor(private readonly blogsRepository: BlogsRepository) {}

	async validate(value: string): Promise<boolean> {
		const blog = await this.blogsRepository.getBlogById(value)

		return !!blog
	}

	defaultMessage(validationArguments?: ValidationArguments): string {
		return 'Incorrect blogId'
	}
}

export class CreatePostDtoModel {
	@IsString({ message: 'Title must be a string' })
	@Trim()
	@MinLength(1, { message: 'Title is too short' })
	@MaxLength(30, { message: 'Title is too long' })
	title: string

	@IsString({ message: 'ShortDescription must be a string' })
	@Trim()
	@MinLength(1, { message: 'ShortDescription is too short' })
	@MaxLength(100, { message: 'ShortDescription is too long' })
	shortDescription: string

	@IsString({ message: 'Content must be a string' })
	@Trim()
	@MinLength(1, { message: 'Content is too short' })
	@MaxLength(1000, { message: 'Content is too long' })
	content: string

	@IsString({ message: 'BlogId must be a string' })
	@MinLength(1, { message: 'BlogId is too short' })
	@MaxLength(100, { message: 'BlogId is too long' })
	@Validate(BlogIdValidation)
	blogId: string
}

export class UpdatePostDtoModel {
	@IsString({ message: 'Title must be a string' })
	@Trim()
	@MinLength(1, { message: 'Title is too short' })
	@MaxLength(30, { message: 'Title is too long' })
	title: string

	// ERROR
	@IsString({ message: 'ShortDescription must be a string' })
	@Trim()
	@MinLength(1, { message: 'ShortDescription is too short' })
	@MaxLength(100, { message: 'ShortDescription is too long' })
	shortDescription: string

	@IsString({ message: 'Content must be a string' })
	@Trim()
	@MinLength(1, { message: 'Content is too short' })
	@MaxLength(1000, { message: 'Content is too long' })
	content: string

	@IsString({ message: 'BlogId must be a string' })
	@MinLength(1, { message: 'BlogId is too short' })
	@MaxLength(100, { message: 'BlogId is too long' })
	@Validate(BlogIdValidation)
	blogId: string
}

export class GetPostsQueries {
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
	@Min(1)
	// pageSize is portions size that should be returned. Default value : 10
	pageSize?: number
}

@Injectable()
export class GetPostsQueriesPipe implements PipeTransform {
	async transform(dto: GetPostsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}

export class GetPostCommentsQueries {
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
	@Min(1)
	// pageNumber is number of portions that should be returned. Default value : 1
	pageNumber?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	// pageSize is portions size that should be returned. Default value : 10
	pageSize?: number
}

@Injectable()
export class GetPostCommentsQueriesPipe implements PipeTransform {
	async transform(dto: GetPostCommentsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}

export class CreatePostCommentDtoModel {
	@IsString()
	@MinLength(20, { message: 'Content is too short' })
	@MaxLength(300, { message: 'Content is too long' })
	content: string
}
