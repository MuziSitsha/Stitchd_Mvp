import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'stitchd',
  password: process.env.DB_PASSWORD || 'stitchd_dev',
  name: process.env.DB_NAME || 'stitchd_db',
}));
