import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PlansModule } from './plans/plans.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AppConfigModule } from './config/app-config.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
