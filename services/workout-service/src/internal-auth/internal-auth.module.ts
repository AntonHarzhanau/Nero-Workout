import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InternalTokenGuard } from './internal-token.guard.js';

@Module({
  imports: [ConfigModule],
  providers: [InternalTokenGuard],
  exports: [InternalTokenGuard],
})
export class InternalAuthModule {}
