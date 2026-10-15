import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createTypeOrmOptions } from "./typeorm.config.js";
import { ConfigService } from "@nestjs/config";
import { AppConfigModule } from "../config/app-config.module.js";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [AppConfigModule],
            inject: [ConfigService],
            useFactory: createTypeOrmOptions,
        })
    ],
})

export class DatabaseModule {}