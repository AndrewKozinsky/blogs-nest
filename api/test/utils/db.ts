import { HttpStatus, INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import RouteNames from '../../src/settings/routeNames'

export async function clearAllDB(app: INestApplication<any>) {
	await request(app.getHttpServer())
		.delete(RouteNames.testingAllData)
		.expect(HttpStatus.NO_CONTENT)
}
