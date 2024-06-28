import { InjectDataSource, TypeOrmModuleOptions } from '@nestjs/typeorm'
import dotenv from 'dotenv'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

dotenv.config()

const dbUserName = process.env.DB_USER_NAME

@Injectable()
export class DbService {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async drop() {
		// Recipe 1
		/*try {
			const tablesNames = [
				'ratelimites',
				'devicetokens',
				'commentlikes',
				'comments',
				'postlikes',
				'posts',
				'blogs',
				'users',
			]

			let query = ''

			tablesNames.forEach((tableName) => {
				query += `DELETE FROM ${tableName}; `
			})

			await this.dataSource.query(query, [])

			return true
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err.message)
			}

			return false
		}*/

		// Recipe 2
		try {
			const query = `CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
			DECLARE
				statements CURSOR FOR
					SELECT tablename FROM pg_tables
					WHERE tableowner = username AND schemaname = 'public';
			BEGIN
				FOR stmt IN statements LOOP
					EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
				END LOOP;
			END;
			$$ LANGUAGE plpgsql;

			SELECT truncate_tables('${dbUserName}');`

			await this.dataSource.query(query, [])

			return true
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err.message)
			}

			return false
		}
	}
}
