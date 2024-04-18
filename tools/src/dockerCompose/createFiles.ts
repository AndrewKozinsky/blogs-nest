import fs from 'node:fs'
import * as YAML from 'yaml'
import { createDockerConfig } from './config'

// Массив с названием и контентом трёх файлов.
const configs = [
	{
		// Докер для разработки
		name: 'dev',
		content: createDockerConfig('dev'),
	},
	{
		// Докер для проверки как соберётся сборка для сервера
		name: 'server-check',
		content: createDockerConfig('serverCheck'),
	},
	{
		// Докер для развёртывания
		name: 'server',
		content: createDockerConfig('server'),
	},
]

for (let i = 0; i < configs.length; i++) {
	const dataItem = configs[i]

	const filePath = '../docker-compose.' + dataItem.name + '.yml'
	const content = YAML.stringify(dataItem.content)

	fs.writeFile(filePath, content, (err) => {
		if (err) {
			console.error(err)
		} else {
			// file written successfully
		}
	})
}
