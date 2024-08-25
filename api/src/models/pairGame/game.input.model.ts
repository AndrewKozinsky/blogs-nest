import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance, Type } from 'class-transformer'
import { IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'
import { Trim } from '../../infrastructure/pipes/Trim.decorator'

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
	async transform(dto: GetMyGamesQueries, { metatype }: ArgumentMetadata) {
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
	async transform(queries: GetTopStatisticQueries, { metatype }: ArgumentMetadata) {
		// Sort property will be like
		// '?sort=avgScores desc&sort=sumScore desc'
		if (!metatype) {
			return queries
		}

		if (queries.sort && !Array.isArray(queries.sort)) {
			queries.sort = [queries.sort]
		}

		// Remove all unresolved property names
		const resolvedSortPropNames = [
			'sumScore',
			'avgScores',
			'gamesCount',
			'winsCount',
			'lossesCount',
			'drawsCount',
		]

		if (queries.sort) {
			queries.sort = queries.sort?.filter((sortStr) => {
				// 'sumScore desc' -> 'sumScore'
				const propName = sortStr.split(' ')[0]
				return resolvedSortPropNames.includes(propName)
			})
		}

		return plainToInstance(metatype, queries)
	}
}
