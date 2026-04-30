import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'kazi',
  password: process.env.DB_PASSWORD || 'kazi_dev',
  database: process.env.DB_NAME || 'kazi_db',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});