import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { AuthUser } from './auth-user.js';
import { CurrentUser } from './current-user.decorator.js';

class Consumer {
  read(@CurrentUser() user: AuthUser) {
    return user;
  }
}

const argumentsMetadata = Reflect.getMetadata(
  ROUTE_ARGS_METADATA,
  Consumer,
  'read',
);
const factory = Object.values(argumentsMetadata)[0] as {
  factory: (data: unknown, context: ExecutionContext) => AuthUser;
};

describe('CurrentUser', () => {
  it('returns the verified identity attached to the request', () => {
    const user: AuthUser = { id: 'owner', role: 'admin' };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as ExecutionContext;
    expect(factory.factory(undefined, context)).toBe(user);
  });

  it('rejects a request without an authenticated user', () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as ExecutionContext;
    expect(() => factory.factory(undefined, context)).toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });
});
