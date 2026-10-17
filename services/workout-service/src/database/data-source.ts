import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export default new DataSource({
  type: 'postgres',
  host: requiredEnv('DB_HOST'),
  port: Number(requiredEnv('DB_PORT')),
  username: requiredEnv('DB_USER'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),
  schema: 'workouts',

  entities: [resolve(process.cwd(), 'src/**/*.entity.ts')],

  migrations: [
    fileURLToPath(new URL('./migrations/*.ts', import.meta.url)),
  ],
  synchronize: false,
  migrationsRun: false,
});
