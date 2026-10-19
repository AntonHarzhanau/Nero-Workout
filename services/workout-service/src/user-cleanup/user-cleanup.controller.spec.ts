import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';

import { InternalTokenGuard } from '../internal-auth/internal-token.guard.js';
import { UserCleanupController } from './user-cleanup.controller.js';
import { UserCleanupService } from './user-cleanup.service.js';

describe('User cleanup internal HTTP API', () => {
  let app: INestApplication;
  let directory: string;
  const userId = '11111111-1111-4111-8111-111111111111';
  const service = { deleteUserData: vi.fn() };

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'nero-internal-token-'));
    const path = join(directory, 'token');
    writeFileSync(path, 'internal-test-secret\n', { mode: 0o600 });
    const module = await Test.createTestingModule({
      controllers: [UserCleanupController],
      providers: [
        InternalTokenGuard,
        { provide: UserCleanupService, useValue: service },
        {
          provide: ConfigService,
          useValue: new ConfigService({ INTERNAL_API_TOKEN_FILE: path }),
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    service.deleteUserData.mockResolvedValue(undefined);
  });

  it('accepts repeated authenticated DELETE requests at the Account client URL', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(app.getHttpServer())
        .delete(`/internal/users/${userId}`)
        .set('X-Internal-Token', 'internal-test-secret')
        .expect(204);
      expect(response.text).toBe('');
    }
    expect(service.deleteUserData).toHaveBeenCalledTimes(2);
    expect(service.deleteUserData).toHaveBeenCalledWith(userId);
  });

  it.each([undefined, 'wrong', 'different-secret-xxx'])(
    'rejects invalid internal credentials: %s',
    async (token) => {
      const call = request(app.getHttpServer()).delete(
        `/internal/users/${userId}`,
      );
      if (token) call.set('X-Internal-Token', token);
      await call.expect(401);
      expect(service.deleteUserData).not.toHaveBeenCalled();
    },
  );

  it('does not accept a user Bearer token as internal credentials', async () => {
    await request(app.getHttpServer())
      .delete(`/internal/users/${userId}`)
      .set('Authorization', 'Bearer user-token')
      .expect(401);
    expect(service.deleteUserData).not.toHaveBeenCalled();
  });

  it('rejects invalid user IDs before calling cleanup', async () => {
    await request(app.getHttpServer())
      .delete('/internal/users/not-a-uuid')
      .set('X-Internal-Token', 'internal-test-secret')
      .expect(400);
    expect(service.deleteUserData).not.toHaveBeenCalled();
  });

  it('does not report success when cleanup fails', async () => {
    service.deleteUserData.mockRejectedValue(new Error('Database failure'));
    await request(app.getHttpServer())
      .delete(`/internal/users/${userId}`)
      .set('X-Internal-Token', 'internal-test-secret')
      .expect(500);
  });

  it('fails guard initialization if the token file is empty', () => {
    const path = join(directory, 'empty-token');
    writeFileSync(path, ' \n');
    expect(
      () =>
        new InternalTokenGuard(
          new ConfigService({ INTERNAL_API_TOKEN_FILE: path }),
        ),
    ).toThrow('Internal API token must not be empty');
  });
});
