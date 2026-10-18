import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'node:crypto';

import {
  authorization,
  testJwt,
  testJwtWithoutExpiry,
} from '../../test/helpers/auth.js';
import type { AuthenticatedRequest } from './auth-user.js';
import { AuthGuard } from './auth.guard.js';

function context(header?: string) {
  const request = {
    headers: { authorization: header },
  } as AuthenticatedRequest;
  const execution = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  return { request, execution };
}

describe('AuthGuard JWT verification', () => {
  const guard = new AuthGuard(testJwt);
  const subject = '11111111-1111-4111-8111-111111111111';

  it.each(['user1', 'admin'])(
    'extracts verified identity for %s',
    async (profile) => {
      const { request, execution } = context(authorization(profile));
      await expect(guard.canActivate(execution)).resolves.toBe(true);
      expect(request.user).toEqual({
        id:
          profile === 'admin'
            ? '33333333-3333-4333-8333-333333333333'
            : subject,
        role: profile === 'admin' ? 'admin' : 'standard',
      });
    },
  );

  it.each([undefined, 'Bearer', 'Bearer invalid'])(
    'rejects missing or malformed token: %s',
    async (header) => {
      const { request, execution } = context(header);
      await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(request.user).toBeUndefined();
    },
  );

  it.each([
    ['invalid UUID', { sub: 'not-a-uuid', role: 'standard' }],
    ['unknown role', { sub: subject, role: 'superadmin' }],
    ['missing role', { sub: subject }],
  ])('rejects signed claims with %s', async (_name, payload) => {
    const { request, execution } = context(`Bearer ${testJwt.sign(payload)}`);
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });

  it.each([
    ['wrong issuer', { issuer: 'another-service' }],
    ['wrong audience', { audience: 'another-app' }],
    ['expired token', { expiresIn: -1 }],
    ['missing issued-at', { noTimestamp: true }],
  ])('rejects %s', async (_name, options) => {
    const token = testJwt.sign({ sub: subject, role: 'standard' }, options);
    const { request, execution } = context(`Bearer ${token}`);
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });

  it('rejects a signed token without expiration', async () => {
    const token = testJwtWithoutExpiry.sign({ sub: subject, role: 'standard' });
    const { execution } = context(`Bearer ${token}`);
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects tokens signed with an untrusted key and algorithm', async () => {
    const token = new JwtService({ secret: 'untrusted-test-secret' }).sign({
      sub: subject,
      role: 'admin',
    });
    const { execution } = context(`Bearer ${token}`);
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an RS256 token signed by another issuer key', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = new JwtService({
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      signOptions: {
        algorithm: 'RS256',
        issuer: 'account-service',
        audience: 'nero',
        expiresIn: 900,
      },
    }).sign({ sub: subject, role: 'admin' });
    const { execution } = context(`Bearer ${token}`);
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
