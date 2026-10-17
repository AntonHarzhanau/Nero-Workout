import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';

import { Exercise } from '../src/exercises/entities/exercise.entity.js';
import { MuscleGroup } from '../src/muscle-groups/entities/muscle-group.entity.js';
import { Plan } from '../src/plans/entities/plan.entity.js';
import { PlanExercise } from '../src/plans/entities/plan-exercise.entity.js';
import { PlanSet } from '../src/plans/entities/plan-set.entity.js';
import { PlansModule } from '../src/plans/plans.module.js';
import type { PlanView, PlanExerciseView } from '../src/plans/plan.types.js';
import { MAX_PLAN_EXERCISES } from '../src/plans/plan.policy.js';
import { Migration1792123844537 } from '../src/database/migrations/1792123844537-Migration.js';
import { Migration1792126492933 } from '../src/database/migrations/1792126492933-Migration.js';
import { Migration1792160311524 } from '../src/database/migrations/1792160311524-Migration.js';

// This suite truncates fixtures. Never point it at an application database.
const databaseUrl = process.env.PLAN_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('Plans API with PostgreSQL', () => {
  let app: INestApplication;
  let source: DataSource;
  let exerciseId: string;
  const sets = [{ weightKg: 50, reps: 10 }];

  beforeAll(async () => {
    if (new URL(databaseUrl!).pathname !== '/plans_module_test') {
      throw new Error('Use a disposable plans_module_test database');
    }
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: databaseUrl,
          schema: 'workouts',
          extra: { options: '-c search_path=workouts,public' },
          entities: [Exercise, MuscleGroup, Plan, PlanExercise, PlanSet],
          migrations: [
            Migration1792123844537,
            Migration1792126492933,
            Migration1792160311524,
          ],
          synchronize: false,
          retryAttempts: 0,
        }),
        PlansModule,
      ],
    }).compile();
    source = module.get(DataSource);
    await source.query('CREATE SCHEMA IF NOT EXISTS workouts');
    await source.runMigrations();
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
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (source?.isInitialized) await source.destroy();
  });

  beforeEach(async () => {
    await source.query('TRUNCATE workouts.plans, workouts.exercises CASCADE');
    const response = await request(app.getHttpServer())
      .post('/exercises')
      .set('X-Dev-User', 'user1')
      .send({ title: 'Bench press', muscleGroups: [] })
      .expect(201);
    exerciseId = response.body.id;
  });

  function createPlan(exercises = [{ exerciseId, sets }]) {
    return request(app.getHttpServer())
      .post('/plans')
      .set('X-Dev-User', 'user1')
      .send({ title: '  Chest  ', exercises })
      .expect(201);
  }

  function getPlan(id: string, user = 'user1') {
    return request(app.getHttpServer())
      .get(`/plans/${id}`)
      .set('X-Dev-User', user);
  }

  it('saves nested positions and decimals and reads current catalog data', async () => {
    const { body } = await createPlan();
    expect(body.title).toBe('Chest');
    expect(body.exercises[0]).toMatchObject({
      position: 1,
      sets: [{ position: 1, weightKg: '50.00', reps: 10 }],
    });
    await request(app.getHttpServer())
      .put(`/exercises/${exerciseId}`)
      .set('X-Dev-User', 'user1')
      .send({ title: 'Renamed exercise', muscleGroups: [] })
      .expect(200);
    const fetched = await getPlan(body.id).expect(200);
    expect(fetched.body.exercises[0].exercise.title).toBe('Renamed exercise');
  });

  it('returns summaries only and keeps foreign plans inaccessible even to an admin', async () => {
    const { body } = await createPlan();
    const list = await request(app.getHttpServer())
      .get('/plans')
      .set('X-Dev-User', 'user1')
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).not.toHaveProperty('exercises');
    expect(list.body[0]).not.toHaveProperty('planExercises');
    for (const user of ['user2', 'admin']) {
      await getPlan(body.id, user).expect(404);
      await request(app.getHttpServer())
        .put(`/plans/${body.id}`)
        .set('X-Dev-User', user)
        .send({ title: 'Changed', exercises: [] })
        .expect(404);
      await request(app.getHttpServer())
        .post(`/plans/${body.id}/exercises`)
        .set('X-Dev-User', user)
        .send({ exerciseId, sets })
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/plans/${body.id}/exercises/${body.exercises[0].id}`)
        .set('X-Dev-User', user)
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/plans/${body.id}`)
        .set('X-Dev-User', user)
        .expect(404);
      const foreignList = await request(app.getHttpServer())
        .get('/plans')
        .set('X-Dev-User', user)
        .expect(200);
      expect(foreignList.body).toEqual([]);
    }
  });

  it('rejects unavailable exercises without changing the plan', async () => {
    const { body } = await createPlan();
    const foreign = await request(app.getHttpServer())
      .post('/exercises')
      .set('X-Dev-User', 'user2')
      .send({ title: 'Private', muscleGroups: [] })
      .expect(201);
    const exercises = [{ exerciseId: foreign.body.id, sets }];
    await request(app.getHttpServer())
      .post('/plans')
      .set('X-Dev-User', 'user1')
      .send({ title: 'Invalid', exercises })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/plans/${body.id}`)
      .set('X-Dev-User', 'user1')
      .send({ title: 'Invalid', exercises })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/plans/${body.id}/exercises`)
      .set('X-Dev-User', 'user1')
      .send(exercises[0])
      .expect(404);
    expect((await getPlan(body.id).expect(200)).body).toEqual(body);
    expect(await source.getRepository(Plan).count()).toBe(1);
  });

  it('replaces inclusions and sets atomically and supports an empty plan', async () => {
    const { body } = await createPlan();
    const updated = await request(app.getHttpServer())
      .put(`/plans/${body.id}`)
      .set('X-Dev-User', 'user1')
      .send({
        title: 'Replacement',
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 12.5, reps: 8 },
              { weightKg: 0, reps: 20 },
            ],
          },
          { exerciseId, sets: [] },
        ],
      })
      .expect(200);
    const view = updated.body as PlanView;
    expect(view.exercises.map((item) => item.position)).toEqual([1, 2]);
    expect(
      view.exercises[0].sets.map((set) => [set.position, set.weightKg]),
    ).toEqual([
      [1, '12.50'],
      [2, '0.00'],
    ]);
    expect(view.exercises[0].id).not.toBe(body.exercises[0].id);
    expect(
      await source
        .getRepository(PlanSet)
        .countBy({ planExerciseId: body.exercises[0].id }),
    ).toBe(0);
    const empty = await request(app.getHttpServer())
      .put(`/plans/${body.id}`)
      .set('X-Dev-User', 'user1')
      .send({ title: 'Empty', exercises: [] })
      .expect(200);
    expect(empty.body.exercises).toEqual([]);
    expect(await source.getRepository(PlanSet).count()).toBe(0);
  });

  it('serializes additions and scopes removal to the specified plan', async () => {
    const { body } = await createPlan([]);
    const add = () =>
      request(app.getHttpServer())
        .post(`/plans/${body.id}/exercises`)
        .set('X-Dev-User', 'user1')
        .send({ exerciseId, sets })
        .expect(201);
    const [first, second] = await Promise.all([add(), add()]);
    expect(
      [first.body.position, second.body.position].sort((a, b) => a - b),
    ).toEqual([1, 2]);
    const other = await createPlan();
    await request(app.getHttpServer())
      .delete(`/plans/${body.id}/exercises/${other.body.exercises[0].id}`)
      .set('X-Dev-User', 'user1')
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/plans/${body.id}/exercises/${first.body.id}`)
      .set('X-Dev-User', 'user1')
      .expect(204);
    const fetched = await getPlan(body.id).expect(200);
    expect(
      (fetched.body.exercises as PlanExerciseView[]).map((item) => item.id),
    ).toEqual([second.body.id]);
    expect(
      await source
        .getRepository(PlanSet)
        .countBy({ planExerciseId: first.body.id }),
    ).toBe(0);
    expect(await source.getRepository(Exercise).count()).toBe(1);
  });

  it('keeps the 200 exercise limit under concurrent additions', async () => {
    const { body } = await createPlan(
      Array.from({ length: MAX_PLAN_EXERCISES - 1 }, () => ({
        exerciseId,
        sets: [],
      })),
    );
    const add = () =>
      request(app.getHttpServer())
        .post(`/plans/${body.id}/exercises`)
        .set('X-Dev-User', 'user1')
        .send({ exerciseId, sets: [] });
    const responses = await Promise.all([add(), add()]);
    expect(
      responses.map((response) => response.status).sort((a, b) => a - b),
    ).toEqual([201, 400]);
    expect(
      await source.getRepository(PlanExercise).countBy({ planId: body.id }),
    ).toBe(MAX_PLAN_EXERCISES);
  });

  it('rolls back replacement when a nested insert fails', async () => {
    const { body } = await createPlan();
    await source.query(
      'ALTER TABLE workouts.plan_sets ADD CONSTRAINT test_plan_reps_limit CHECK (reps <= 10)',
    );
    try {
      await request(app.getHttpServer())
        .put(`/plans/${body.id}`)
        .set('X-Dev-User', 'user1')
        .send({
          title: 'Must roll back',
          exercises: [{ exerciseId, sets: [{ weightKg: 80, reps: 20 }] }],
        })
        .expect(500);
      expect((await getPlan(body.id).expect(200)).body).toEqual(body);
    } finally {
      await source.query(
        'ALTER TABLE workouts.plan_sets DROP CONSTRAINT test_plan_reps_limit',
      );
    }
  });

  it('rolls back addition when a nested insert fails', async () => {
    const { body } = await createPlan();
    await source.query(
      'ALTER TABLE workouts.plan_sets ADD CONSTRAINT test_plan_reps_limit CHECK (reps <= 10)',
    );
    try {
      await request(app.getHttpServer())
        .post(`/plans/${body.id}/exercises`)
        .set('X-Dev-User', 'user1')
        .send({ exerciseId, sets: [{ weightKg: 80, reps: 20 }] })
        .expect(500);
      expect((await getPlan(body.id).expect(200)).body).toEqual(body);
      expect(await source.getRepository(PlanExercise).count()).toBe(1);
    } finally {
      await source.query(
        'ALTER TABLE workouts.plan_sets DROP CONSTRAINT test_plan_reps_limit',
      );
    }
  });

  it('deletes a plan and its children while preserving the catalog', async () => {
    const { body } = await createPlan();
    await request(app.getHttpServer())
      .delete(`/plans/${body.id}`)
      .set('X-Dev-User', 'user1')
      .expect(204);
    expect(await source.getRepository(Plan).count()).toBe(0);
    expect(await source.getRepository(PlanExercise).count()).toBe(0);
    expect(await source.getRepository(PlanSet).count()).toBe(0);
    expect(await source.getRepository(Exercise).count()).toBe(1);
  });
});
