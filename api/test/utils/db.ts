import { HttpStatus } from '@nestjs/common'
import { agent as request } from 'supertest'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import RouteNames from '../../src/config/routeNames'

export async function clearAllDB() {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile()

	const app = moduleFixture.createNestApplication()
	await app.init()

	await request(app.getHttpServer())
		.delete(RouteNames.testingAllData)
		.expect(HttpStatus.NO_CONTENT)
}
