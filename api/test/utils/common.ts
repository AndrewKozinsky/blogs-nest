import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { applyAppSettings } from '../../src/settings/applyAppSettings'

export const adminAuthorizationValue = 'Basic YWRtaW46cXdlcnR5'
export const userLogin = 'my-login'
export const userEmail = 'mail@email.com'
export const userPassword = 'password'

export async function createTestApp() {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile()

	const app = moduleFixture.createNestApplication()
	applyAppSettings(app)
	await app.init()

	return app
}
