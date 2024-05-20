import { OnModuleInit } from '@nestjs/common'
import { DataSource } from 'typeorm'

// DELETE !!!
// It creates empty Postgres tables if they are not exist
export class PgTablesCreator implements OnModuleInit {
	constructor(private dataSource: DataSource) {}

	onModuleInit() {
		// console.log(this.dataSource)
		console.log('The module has been')
	}
}
