import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance, Type } from 'class-transformer'
import {
	ArrayMinSize,
	IsArray,
	IsIn,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator'

export class CreateQuizQuestionDtoModel {
	@IsString({ message: 'Body must be a string' })
	@MinLength(10, { message: 'Body is too short' })
	@MaxLength(500, { message: 'Body is too long' })
	body: string

	@IsArray({ message: 'CorrectAnswers must be an array of strings' })
	@IsString({ each: true })
	@ArrayMinSize(1)
	correctAnswers: string[]
}

export class UpdateQuizQuestionDtoModel {
	@IsString({ message: 'Body must be a string' })
	@MinLength(10, { message: 'Body is too short' })
	@MaxLength(500, { message: 'Body is too long' })
	body: string

	@IsArray({ message: 'CorrectAnswers must be an array of strings' })
	@IsString({ each: true })
	@ArrayMinSize(1)
	correctAnswers: string[]
}

export class GetQuizQuestionsQueries {
	@IsOptional()
	@IsString({ message: 'BodySearchTerm must be a string' })
	// Search term for blog Name: Name should contain this term in any position
	bodySearchTerm?: string

	@IsOptional()
	@IsIn(['all', 'published', 'notPublished'])
	publishedStatus?: 'all' | 'published' | 'notPublished'

	@IsOptional()
	@IsString({ message: 'SortBy must be a string' })
	// Default value: createdAt
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
export class GetQuizQuestionsQueriesPipe implements PipeTransform {
	async transform(dto: GetQuizQuestionsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}
