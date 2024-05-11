import { ConfigSchemaV37Json } from './types/ConfigSchemaV37Json'

/**
 * Возращает объект конфигурации docker-compose для разработки, проверки развёртывания на сервере и для сервера
 * @param env — тип конфигурации
 */
export function createDockerConfig(env: 'dev' | 'serverCheck' | 'server'): ConfigSchemaV37Json {
	const DB_TYPE: 'mongo' | 'postgres' = 'postgres'

	const AUTH_LOGIN = 'admin'
	const AUTH_PASSWORD = 'qwerty'
	const JWT_SECRET = 123

	const DB_USER_NAME = 'admin'
	const DB_USER_PASSWORD = '123'
	const DB_NAME = 'blogs'

	const MONGO_URL = 'mongodb://blogs-mongo:27017'
	const POSTGRES_PORT = 5432

	return {
		version: '3',

		services: {
			nginx: {
				image: 'nginx:1.19.7-alpine',
				container_name: 'blogs-nginx',
				depends_on: ['api', 'mongo'],
				ports: env === 'server' ? undefined : ['80:80'],
				environment:
					env === 'server'
						? {
								VIRTUAL_HOST: 'blogs.andrewkozinsky.ru',
								LETSENCRYPT_HOST: 'blogs.andrewkozinsky.ru',
							}
						: undefined,
				volumes:
					env === 'server'
						? ['./nginx/nginx.conf.server:/etc/nginx/nginx.conf']
						: ['./nginx/nginx.conf.dev:/etc/nginx/nginx.conf'],
			},
			mongo: {
				image: env === 'server' ? 'mongo:4.4.6' : 'mongo:6.0.13',
				restart: 'unless-stopped',
				container_name: 'blogs-mongo',
				ports: ['27017:27017'],
				volumes: ['dbdata6:/data/db'],
			},
			postgres: {
				image: 'postgres:16.2',
				restart: 'unless-stopped',
				container_name: 'blogs-postgres',
				ports: [POSTGRES_PORT + ':' + POSTGRES_PORT],
				environment: {
					POSTGRES_USER: DB_USER_NAME,
					POSTGRES_PASSWORD: DB_USER_PASSWORD,
					POSTGRES_DB: DB_NAME,
				},
			},
			api: {
				build: {
					context: 'api/',
					dockerfile: 'Dockerfile',
				},
				volumes:
					env === 'server'
						? undefined
						: [
								'./api/src:/app/src',
								'./api/test:/app/test',
								'./api/package.json:/app/package.json',
							],
				container_name: 'blogs-api',
				command: env === 'server' ? 'yarn run start' : 'yarn run start:dev',
				restart: 'unless-stopped',
				environment: {
					AUTH_LOGIN,
					AUTH_PASSWORD,
					JWT_SECRET,
					DB_TYPE,
					DB_NAME,
					MONGO_URL,
					POSTGRES_PORT,
					DB_USER_NAME,
					DB_USER_PASSWORD,
				},
			},
		},
		volumes: {
			dbdata6: {},
			postgres: {},
		},

		networks: env === 'server' ? getServerNetworks() : undefined,
	}
}

function getServerNetworks() {
	return {
		default: {
			external: {
				name: 'nginx-proxy',
			},
		},
	}
}
