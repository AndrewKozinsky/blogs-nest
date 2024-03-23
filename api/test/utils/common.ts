// import { app } from '../../../src/app'
// import { ClassNames } from '../../../src/composition/classNames'
// import { myContainer } from '../../../src/composition/inversify.config'
// import { DbService } from '../../../src/db/dbService'

import { clearAllDB } from './db'

// const dbService = new DbService()

import { DbService } from '../../src/db/dbService'

export function resetDbEveryTest() {
	beforeAll(async () => {
		// await dbService.runDb()
	})

	beforeEach(async () => {
		await clearAllDB()
	})

	afterAll(async function () {
		// await dbService.close()
	})
}
