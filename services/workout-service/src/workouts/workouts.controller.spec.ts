import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthGuard } from '../auth/auth.guard.js';
import { WorkoutsController } from './workouts.controller.js';
import { WorkoutsService } from './workouts.service.js';

describe('WorkoutsController HTTP validation', () => {
  let app: INestApplication;
  const service = {
    create: vi.fn(),
    findMine: vi.fn(),
    removeExercise: vi.fn(),
  };
  const id = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [
        { provide: WorkoutsService, useValue: service },
        AuthGuard,
        { provide: ConfigService, useValue: new ConfigService() },
      ],
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
    vi.clearAllMocks();
  });

  it('rejects requests without a user', async () => {
    await request(app.getHttpServer()).get('/workouts').expect(401);
    expect(service.findMine).not.toHaveBeenCalled();
  });

  it('rejects invalid nested sets and impossible dates', async () => {
    await request(app.getHttpServer())
      .post('/workouts')
      .set('X-Dev-User', 'user1')
      .send({
        title: 'Workout',
        workoutDate: '2026-02-30',
        exercises: [{ exerciseId: id, sets: [{ weightKg: -1, reps: 0 }] }],
      })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('does not accept an owner supplied in the body', async () => {
    await request(app.getHttpServer())
      .post('/workouts')
      .set('X-Dev-User', 'user1')
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
      .set('X-Dev-User', 'user1')
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
      .set('X-Dev-User', 'user1')
      .expect(400);
    expect(service.removeExercise).not.toHaveBeenCalled();
  });
});
