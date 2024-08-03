export type LayerResult<T> = SuccessLayerResult<T> | FailLayerResult

type SuccessLayerResult<T> = {
	code: LayerSuccessCode
	data: T
}

type FailLayerResult = {
	code: LayerErrorCode
	errorMessage?: string
}

export enum LayerSuccessCode {
	Success = 0,
}

export enum LayerErrorCode {
	NotFound = 1,
	Unauthorized = 2,
	BadRequest = 3,
	Forbidden = 4,
}
