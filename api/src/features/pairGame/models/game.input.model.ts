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
	sortBy?: string

	@IsOptional()
	@IsIn(['desc', 'asc'])
	sortDirection?: 'desc' | 'asc'

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	pageNumber?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
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

export class GetTopStatisticQueries {
	// Query параметр sort - это строка вида
	// ?sort=avgScores desc&sort=sumScore desc&sort=winsCount desc&sort=lossesCount asc.
	// После преобразования на стороне back-end поле sort из query будет иметь вид:
	// sort: ["avgScores desc", "sumScore desc", "winsCount desc", "lossesCount asc"]
	@IsOptional()
	sort?: string[]

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	pageNumber?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	pageSize?: number
}

@Injectable()
export class GetTopStatisticQueriesPipe implements PipeTransform {
	async transform(queries: GetBlogsQueries, { metatype }: ArgumentMetadata) {
		// Sort property will be like
		// '?sort=avgScores desc&sort=sumScore desc'
		if (!metatype) {
			return queries
		}

		return plainToInstance(metatype, queries)
	}
}
