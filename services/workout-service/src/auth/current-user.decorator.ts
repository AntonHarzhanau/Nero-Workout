import {
    createParamDecorator,
    type ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest, AuthUser } from './auth-user.js';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): AuthUser => {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        if (!request.user) {
            throw new UnauthorizedException('User not authenticated');
        }

        return request.user;
    }
)