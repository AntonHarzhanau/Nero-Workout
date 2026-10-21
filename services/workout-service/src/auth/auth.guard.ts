import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth-user.js';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const bearerToken = request.headers.authorization?.split(' ')[1];
    if (!bearerToken) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload =
        await this.jwt.verifyAsync<Record<string, unknown>>(bearerToken);

      if (
        typeof payload.sub !== 'string' || !isUUID(payload.sub) ||

        (payload.role !== 'standard' && payload.role !== 'admin') ||

        typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) ||

        typeof payload.iat !== 'number' || !Number.isFinite(payload.iat)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        id: payload.sub,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
