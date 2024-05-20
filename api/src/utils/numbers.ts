export function convertToNumber(data: any): null | number {
	try {
		const number = parseInt(data)

		if (isNaN(number)) {
			throw new Error('Wrong data')
		}

		return number
	} catch (err: unknown) {
		return null
	}
}

/**
 * Вычленяет из строки число: 'abc123d' => 123
 * @param str — строка с числом
 */
export function extractNumFromStr(str: string): number {
	const regExp = new RegExp(/^\D+/, 'g')
	const numStr = str.replace(regExp, '')
	return parseInt(numStr)
}
