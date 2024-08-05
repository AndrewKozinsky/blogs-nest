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
	NotFound_404 = 1,
	Unauthorized_401 = 2,
	BadRequest_400 = 3,
	Forbidden_403 = 4,
}
