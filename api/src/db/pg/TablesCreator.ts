import { DataSource } from 'typeorm'

// It creates empty Postgres tables if they are not exist
export class PgTablesCreator {
	constructor(private dataSource: DataSource) {}

	// It creates empty Postgres tables if they are not exist
	async create() {
		await this.dataSource.query(
			`CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	login VARCHAR,
	email VARCHAR,
	password VARCHAR,
	passwordRecoveryCode VARCHAR,
	createdAt VARCHAR,
	emailConfirmationCode VARCHAR,
	confirmationCodeExpirationDate VARCHAR,
	isConfirmationEmailCodeConfirmed BOOLEAN
)`,
			[],
		)

		try {
			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS blogs (
	id SERIAL PRIMARY KEY,
  name VARCHAR,
  description VARCHAR,
  websiteUrl VARCHAR,
  createdAt VARCHAR,
  isMembership BOOLEAN
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR,
  	shortDescription VARCHAR,
  	content TEXT,
  	createdAt VARCHAR,
    blogId SERIAL REFERENCES blogs(id)
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS postlikes (
	id SERIAL PRIMARY KEY,
	postId SERIAL REFERENCES posts(id),
	userId SERIAL REFERENCES users(id),
	status VARCHAR,
	addedAt VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS comments (
	id SERIAL PRIMARY KEY,
	content TEXT,
	postId SERIAL REFERENCES posts(id),
	userId SERIAL REFERENCES users(id),
	createdAt VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS commentlikes (
	id SERIAL PRIMARY KEY,
	commentId SERIAL REFERENCES comments(id),
	userId SERIAL REFERENCES users(id),
	status VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS ratelimites (
	id SERIAL PRIMARY KEY,
	ip VARCHAR,
	date VARCHAR,
	path VARCHAR,
	method VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS devicetokens (
	id SERIAL PRIMARY KEY,
	issuedAt VARCHAR,
	userId SERIAL REFERENCES users(id),
	expirationDate VARCHAR,
	deviceIP VARCHAR,
  	deviceId VARCHAR,
  	deviceName VARCHAR
)`,
				[],
			)
		} catch (error) {
			console.log(error)
		}
	}
}
