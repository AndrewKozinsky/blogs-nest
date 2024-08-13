import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance, Type } from 'class-transformer'
import { IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'
import { Trim } from '../../../infrastructure/pipes/Trim.decorator'
import { GetBlogsQueries } from '../../blogs/blogs/model/blogs.input.model'

export class AnswerGameQuestionDtoModel {
	@IsString({ message: 'Answer must be a string' })
	@Trim()
	@MinLength(1, { message: 'Answer is too short' })
	answer: string
}

export class GetMyGamesQueries {
	@IsOptional()
	@IsString({ message: 'SortBy must be a string' })
	// Default value : pairCreatedDate
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
export class GetMyGamesQueriesPipe implements PipeTransform {
	async transform(dto: GetBlogsQueries, { metatype }: ArgumentMetadata) {
		if (!metatype) {
			return dto
		}

		return plainToInstance(metatype, dto)
	}
}
