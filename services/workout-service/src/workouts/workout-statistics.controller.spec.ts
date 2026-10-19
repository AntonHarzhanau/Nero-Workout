import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { InternalAuthModule } from '../internal-auth/internal-auth.module.js';
import { WorkoutStatisticsController } from './workout-statistics.controller.js';
import { WorkoutStatisticsService } from './workout-statistics.service.js';
import type { WorkoutStatisticsView } from './workout.types.js';

describe('Statistics internal HTTP API', () => {
  let app: INestApplication;
  let directory: string;
  const userId = '11111111-1111-4111-8111-111111111111';
  const token = 'statistics-test-secret';
  const service = { findForUser: vi.fn() };
  const result: WorkoutStatisticsView[] = [
    {
      id: 'workout',
      workoutDate: '2026-10-15',
      durationMinutes: null,
      exercises: [
        {
          exerciseId: 'exercise',
          exerciseName: 'Squat',
          muscleGroups: ['core', 'legs'],
          sets: [{ weightKg: '0.00', reps: 12 }],
        },
      ],
    },
  ];

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'nero-statistics-http-'));
    const path = join(directory, 'token');
    writeFileSync(path, token + '\n', { mode: 0o600 });
    const module = await Test.createTestingModule({
      imports: [ConfigModule, InternalAuthModule],
      controllers: [WorkoutStatisticsController],
      providers: [{ provide: WorkoutStatisticsService, useValue: service }],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ INTERNAL_API_TOKEN_FILE: path }))
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    service.findForUser.mockResolvedValue(result);
  });

  function get(user = userId) {
    return request(app.getHttpServer()).get(`/internal/users/${user}/workouts`);
  }

  it.each([
    {},
    { from: '2026-10-01' },
    { to: '2026-10-31' },
    { from: '2026-10-01', to: '2026-10-31' },
    { from: '2024-02-29', to: '2024-02-29' },
  ])(
    'accepts service credentials without a user JWT and forwards validated dates %j',
    async (query) => {
      const response = await get()
        .set('X-Internal-Token', token)
        .query(query)
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.body).toEqual(result);
      expect(service.findForUser).toHaveBeenCalledExactlyOnceWith(
        userId,
        query,
      );
    },
  );

  it('returns 200 and [] when no workouts exist', async () => {
    service.findForUser.mockResolvedValue([]);
    expect(
      (await get().set('X-Internal-Token', token).expect(200)).body,
    ).toEqual([]);
    expect(service.findForUser).toHaveBeenCalledExactlyOnceWith(userId, {});
  });

  it.each([undefined, '', 'wrong', 'statistics-test-secrex'])(
    'rejects absent or invalid credentials %s before accessing user data',
    async (credentials) => {
      const call = get();
      if (credentials !== undefined) call.set('X-Internal-Token', credentials);
      const response = await call.expect(401);
      expect(response.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: credentials
          ? 'Invalid internal token.'
          : 'Internal token is required.',
      });
      expect(service.findForUser).not.toHaveBeenCalled();
    },
  );

  it('does not accept a user JWT in place of the internal token', async () => {
    await get().set('Authorization', 'Bearer user-jwt').expect(401);
    expect(service.findForUser).not.toHaveBeenCalled();
  });

  it.each(['invalid', '11111111-1111-4111-8111-11111111111z'])(
    'rejects invalid user ID %s before calling the service',
    async (user) => {
      await get(user).set('X-Internal-Token', token).expect(400);
      expect(service.findForUser).not.toHaveBeenCalled();
    },
  );

  it.each([
    { from: 'invalid' },
    { to: '2026-02-30' },
    { from: '2026-02-29' },
    { from: '2026-13-01' },
    { to: '2026-00-01' },
    { from: '2026-10-00' },
    { from: '2026-10-01T00:00:00Z' },
    { to: '2026-10' },
    { from: '' },
    { to: '' },
    { from: ['2026-10-01', '2026-10-02'] },
    { to: ['2026-10-30', '2026-10-31'] },
    { from: '0000-01-01' },
    { to: '2026-1-01' },
    { userId: 'another-user' },
    { limit: 1 },
  ])('rejects invalid or unsupported query %j', async (query) => {
    await get().set('X-Internal-Token', token).query(query).expect(400);
    expect(service.findForUser).not.toHaveBeenCalled();
  });

  it('does not mask failures as successful empty data', async () => {
    service.findForUser.mockRejectedValue(new Error('Database failure'));
    await get().set('X-Internal-Token', token).expect(500);
  });
});
