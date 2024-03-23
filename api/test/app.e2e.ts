import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'

describe('AppController (e2e)', () => {
	let app: INestApplication

	beforeEach(async () => {
		app = await createTestApp()
		await clearAllDB(app)
	})

	it.skip('/ (GET)', () => {
		return request(app.getHttpServer()).get('/blogs').expect(200)
		// return request(app.getHttpServer()).get('/blogs').expect(200).expect('Hello World!')
	})
})
