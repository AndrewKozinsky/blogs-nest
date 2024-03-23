import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'

export function resetDbEveryTest() {
	beforeAll(async () => {
		// await dbService.runDb()
	})

	beforeEach(async () => {
		// await clearAllDB()
	})
}

export async function createTestApp() {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile()

	const app = moduleFixture.createNestApplication()
	await app.init()

	return app
}
