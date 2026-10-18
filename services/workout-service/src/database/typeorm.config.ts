import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {

    const isProduction = config.getOrThrow<string>('NODE_ENV') === 'production';
    console.log('isProduction', isProduction);
    return {
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<number>('DB_PORT')),
        database: config.getOrThrow<string>('DB_NAME'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        schema: 'workouts',
        autoLoadEntities: true,
        synchronize: false,
        logging: isProduction ? ['error'] : ['error'],
        maxQueryExecutionTime: 200
    }
}