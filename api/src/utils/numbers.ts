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

/**
 * Round float number to fixed decimal count: 6.2569 -> 6.26
 * @param num
 * @param decimalCount
 */
export function cropDecimalFromFloatNumber(num: number, decimalCount: number): number {
	try {
		// 6.2569 -> '6.26'
		// 6.2 -> '6.20'
		const numberString = num.toFixed(decimalCount)

		// '6.25' -> 6.25
		// '6.20' -> 6.2
		return parseFloat(numberString)
	} catch (error) {
		// The code upper throw an error if to pass an integer
		// In this case return it without convertation because it is ready
		return num
	}
}
