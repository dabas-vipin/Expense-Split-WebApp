import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load .env into process.env before reading values below.
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.{js,ts}'],
  migrations: ['src/migrations/*.{js,ts}'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true',
});
