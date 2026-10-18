import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard.js';
import { JwtModule } from '@nestjs/jwt';
import { readFile } from 'fs/promises';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (config: ConfigService) => ({
        publicKey: await readFile(
          config.getOrThrow<string>('JWT_PUBLIC_KEY'),
          'utf-8',
        ),

        verifyOptions: {
          algorithms: ['RS256'],
          issuer: 'account-service',
          audience: 'nero',
        }
      }),
    }),
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
