import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
    return {
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<number>('DB_PORT')),
        database: config.getOrThrow<string>('DB_NAME'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        schema: 'workouts',
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
    }
}