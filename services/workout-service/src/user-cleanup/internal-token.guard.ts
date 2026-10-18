import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import type { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  private readonly expectedToken: Buffer;

  constructor(config: ConfigService) {
    const path = config.getOrThrow<string>('INTERNAL_API_TOKEN_FILE');
    const token = readFileSync(path, 'utf-8').trim();

    if (!token) {
      throw new Error(`Internal API token must not be empty.`);
    }

    this.expectedToken = Buffer.from(token, 'utf-8');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.get('X-Internal-Token');

    if (!token) {
      throw new UnauthorizedException('Internal token is required.');
    }

    const receivedToken = Buffer.from(token, 'utf-8');

    if (
      receivedToken.length !== this.expectedToken.length ||
      !timingSafeEqual(receivedToken, this.expectedToken)
    ) {
      throw new UnauthorizedException('Invalid internal token.');
    }

    return true;
  }
}
