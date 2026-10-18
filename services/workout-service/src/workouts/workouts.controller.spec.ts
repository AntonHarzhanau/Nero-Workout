import {
  type INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { authorization, TestAuthModule } from '../../test/helpers/auth.js';
import { WorkoutsController } from './workouts.controller.js';
import { WorkoutsService } from './workouts.service.js';

describe('WorkoutsController HTTP validation', () => {
  let app: INestApplication;
  const service = {
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    addExercise: vi.fn(),
    delete: vi.fn(),
    findMine: vi.fn(),
    removeExercise: vi.fn(),
  };
  const id = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestAuthModule],
      controllers: [WorkoutsController],
      providers: [{ provide: WorkoutsService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
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
  });
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects requests without a user', async () => {
    await request(app.getHttpServer()).get('/workouts').expect(401);
    expect(service.findMine).not.toHaveBeenCalled();
  });

  it.each([
    { workoutDate: '2026-02-30' },
    { workoutDate: '2026-10-17T10:00:00Z' },
    { title: '   ' },
    { durationMinutes: -1 },
    { durationMinutes: 5001 },
    { durationMinutes: 1.5 },
    { exercises: [{ exerciseId: 'invalid', sets: [] }] },
    ...[
      { weightKg: -1, reps: 8 },
      { weightKg: 10000, reps: 8 },
      { weightKg: 1.001, reps: 8 },
      { weightKg: 50, reps: 0 },
      { weightKg: 50, reps: 32768 },
      { weightKg: 50, reps: 1.5 },
    ].map((set) => ({ exercises: [{ exerciseId: id, sets: [set] }] })),
    {
      exercises: Array.from({ length: 101 }, () => ({
        exerciseId: id,
        sets: [],
      })),
    },
    {
      exercises: [
        {
          exerciseId: id,
          sets: Array.from({ length: 101 }, () => ({ weightKg: 0, reps: 1 })),
        },
      ],
    },
  ])('rejects invalid input independently (case %#)', async (invalid) => {
    for (const method of ['post', 'put'] as const) {
      const path = method === 'post' ? '/workouts' : `/workouts/${id}`;
      await request(app.getHttpServer())
        [method](path)
        .set('Authorization', authorization('user1'))
        .send({
          title: 'Workout',
          workoutDate: '2026-10-17',
          exercises: [],
          ...invalid,
        })
        .expect(400);
    }
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('does not accept an owner supplied in the body', async () => {
    await request(app.getHttpServer())
      .post('/workouts')
      .set('Authorization', authorization('user1'))
      .send({
        title: 'Workout',
        workoutDate: '2026-10-16',
        ownerId: id,
        exercises: [],
      })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('takes the owner from authentication and permits an empty workout', async () => {
    service.create.mockResolvedValue({ id });
    await request(app.getHttpServer())
      .post('/workouts')
      .set('Authorization', authorization('user1'))
      .send({ title: 'Workout', workoutDate: '2026-10-16', exercises: [] })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ exercises: [] }),
    );
  });

  it('validates the inclusion id for deletion', async () => {
    await request(app.getHttpServer())
      .delete(`/workouts/${id}/exercises/invalid`)
      .set('Authorization', authorization('user1'))
      .expect(400);
    expect(service.removeExercise).not.toHaveBeenCalled();
  });
  it('returns owner-scoped summaries and details from the service', async () => {
    const summary = {
      id,
      title: 'Legs',
      workoutDate: '2026-10-17',
      durationMinutes: 0,
    };
    service.findMine.mockResolvedValue([summary]);
    service.findOne.mockResolvedValue({ ...summary, exercises: [] });
    const list = await request(app.getHttpServer())
      .get('/workouts')
      .set('Authorization', authorization('user1'))
      .expect(200);
    expect(list.body).toEqual([summary]);
    expect(service.findMine).toHaveBeenCalledWith(id);
    const detail = await request(app.getHttpServer())
      .get(`/workouts/${id}`)
      .set('Authorization', authorization('user1'))
      .expect(200);
    expect(detail.body).toEqual({ ...summary, exercises: [] });
    expect(service.findOne).toHaveBeenCalledWith(id, id);
  });

  it('forwards validated replacement and addition and returns service data', async () => {
    const replacement = {
      title: 'Updated',
      workoutDate: '2026-10-18',
      durationMinutes: 0,
      exercises: [],
    };
    service.update.mockResolvedValue({ id, ...replacement });
    const updated = await request(app.getHttpServer())
      .put(`/workouts/${id}`)
      .set('Authorization', authorization('user1'))
      .send(replacement)
      .expect(200);
    expect(updated.body).toEqual({ id, ...replacement });
    expect(service.update).toHaveBeenCalledWith(id, id, replacement);
    const input = { exerciseId: id, sets: [{ weightKg: 0, reps: 1 }] };
    service.addExercise.mockResolvedValue({ id, position: 1, ...input });
    const added = await request(app.getHttpServer())
      .post(`/workouts/${id}/exercises`)
      .set('Authorization', authorization('user1'))
      .send(input)
      .expect(201);
    expect(added.body).toEqual({ id, position: 1, ...input });
    expect(service.addExercise).toHaveBeenCalledWith(id, id, input);
  });

  it('returns 204 without a body for inclusion and workout deletion', async () => {
    const inclusion = '22222222-2222-4222-8222-222222222222';
    const removed = await request(app.getHttpServer())
      .delete(`/workouts/${id}/exercises/${inclusion}`)
      .set('Authorization', authorization('user1'))
      .expect(204);
    expect(removed.text).toBe('');
    expect(service.removeExercise).toHaveBeenCalledWith(id, id, inclusion);
    const deleted = await request(app.getHttpServer())
      .delete(`/workouts/${id}`)
      .set('Authorization', authorization('user1'))
      .expect(204);
    expect(deleted.text).toBe('');
    expect(service.delete).toHaveBeenCalledWith(id, id);
  });

  it.each([
    ['get', '/workouts/invalid'],
    ['put', '/workouts/invalid'],
    ['post', '/workouts/invalid/exercises'],
    ['delete', '/workouts/invalid'],
    ['delete', `/workouts/invalid/exercises/${id}`],
  ] as const)('rejects invalid workout IDs for %s %s', async (method, path) => {
    await request(app.getHttpServer())
      [method](path)
      .set('Authorization', authorization('user1'))
      .expect(400);
    for (const mock of Object.values(service))
      expect(mock).not.toHaveBeenCalled();
  });

  it.each([
    ['get', `/workouts/${id}`],
    ['post', '/workouts'],
    ['put', `/workouts/${id}`],
    ['post', `/workouts/${id}/exercises`],
    ['delete', `/workouts/${id}`],
    ['delete', `/workouts/${id}/exercises/${id}`],
  ] as const)('requires authentication for %s %s', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
    for (const mock of Object.values(service))
      expect(mock).not.toHaveBeenCalled();
  });

  it('validates nested sets on the incremental addition endpoint', async () => {
    await request(app.getHttpServer())
      .post(`/workouts/${id}/exercises`)
      .set('Authorization', authorization('user1'))
      .send({ exerciseId: id, sets: [{ weightKg: -1, reps: 8 }] })
      .expect(400);
    expect(service.addExercise).not.toHaveBeenCalled();
  });

  it('preserves service errors as HTTP status codes', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException('Workout not found'),
    );
    const response = await request(app.getHttpServer())
      .get(`/workouts/${id}`)
      .set('Authorization', authorization('user1'))
      .expect(404);
    expect(response.body.message).toBe('Workout not found');
  });
});
