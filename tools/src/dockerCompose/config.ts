import { ConfigSchemaV37Json } from './types/ConfigSchemaV37Json'

/**
 * Возращает объект конфигурации docker-compose для разработки, проверки развёртывания на сервере и для сервера
 * @param env — тип конфигурации
 */
export function createDockerConfig(env: 'dev' | 'serverCheck' | 'server'): ConfigSchemaV37Json {
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
				// ports: env === 'server' ? undefined : ['3000:3000'],
				environment: {
					AUTH_LOGIN: 'admin',
					AUTH_PASSWORD: 'qwerty',
					MONGO_URL: 'mongodb://blogs-mongo:27017',
					MONGO_DB_NAME: 'blogs',
					JWT_SECRET: 123,
				},
			},
		},
		volumes: {
			dbdata6: {},
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
