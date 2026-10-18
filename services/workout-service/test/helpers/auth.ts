import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'node:crypto';

import { AuthGuard } from '../../src/auth/auth.guard.js';

// Ephemeral test keys never depend on production files or environment secrets.
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

export const testPublicKey = publicKey.export({ type: 'spki', format: 'pem' });

const options = {
  publicKey: testPublicKey,
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  signOptions: {
    algorithm: 'RS256' as const,
    issuer: 'account-service',
    audience: 'nero',
    expiresIn: 900,
  },
  verifyOptions: {
    algorithms: ['RS256' as const],
    issuer: 'account-service',
    audience: 'nero',
  },
};

export const testJwt = new JwtService(options);
export const testJwtWithoutExpiry = new JwtService({
  ...options,
  signOptions: {
    algorithm: 'RS256',
    issuer: 'account-service',
    audience: 'nero',
  },
});

const users: Record<string, { id: string; role: 'standard' | 'admin' }> = {
  user1: { id: '11111111-1111-4111-8111-111111111111', role: 'standard' },
  user2: { id: '22222222-2222-4222-8222-222222222222', role: 'standard' },
  admin: { id: '33333333-3333-4333-8333-333333333333', role: 'admin' },
};

export function authorization(profile: string): string {
  const user = users[profile];
  if (!user) throw new Error(`Unknown test user: ${profile}`);
  return `Bearer ${testJwt.sign({ sub: user.id, role: user.role })}`;
}

@Module({
  imports: [JwtModule.register(options)],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class TestAuthModule {}
