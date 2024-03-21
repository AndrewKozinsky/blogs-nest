import { Request } from 'express'

export type ItemsOutModel<T> = {
	// Общее количество страниц элементов
	pagesCount: number
	// Номер текущей страницы с выводом элементов
	page: number
	// Сколько элементов на странице
	pageSize: number
	// Общее количество элементов
	totalCount: number
	// Элементы на указанной странице
	items: T[]
}

export type ReqWithBody<B> = Request<{}, {}, B>
export type ReqWithQuery<Q> = Request<{}, {}, {}, Q>
export type ReqWithParams<P> = Request<P>
export type ReqWithParamsAndBody<T, B> = Request<T, {}, B>
export type ReqWithParamsAndQueries<P, Q> = Request<P, {}, {}, Q>

export type ErrorMessage = {
	message: string
	field: string
}

export type ErrorResponse = {
	errorsMessages: ErrorMessage[]
}
