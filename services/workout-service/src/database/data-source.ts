import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';

export default new DataSource({
  type: 'postgres',

  host: requiredEnv('DB_HOST'),
  port: Number(requiredEnv('DB_PORT')),
  username: requiredEnv('DB_USER'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),

  schema: 'workouts',

  entities: [
    fileURLToPath(new URL(`../**/*.entity.${extension}`, import.meta.url)),
  ],

  migrations: [
    fileURLToPath(new URL(`./migrations/*.${extension}`, import.meta.url)),
  ],
  synchronize: false,
  migrationsRun: false,
});
