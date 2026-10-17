import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthenticatedRequest } from "./auth-user.js";
import { DEV_USERS } from "./dev-users.js";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        // TODO: add token validation logic

        const profile = request.get('X-Dev-User');

        const user = profile ? DEV_USERS.get(profile) : undefined;

        if (!user) {
            throw new UnauthorizedException('Invalid or missing user profile');
        }

        request.user = { ...user };

        return true;
    }

}
