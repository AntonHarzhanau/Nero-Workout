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
import { Workout } from '../src/workouts/entities/workout.entity.js';
import { WorkoutExercise } from '../src/workouts/entities/workout-exercise.entity.js';
import { WorkoutSet } from '../src/workouts/entities/workout-set.entity.js';
import { WorkoutsModule } from '../src/workouts/workouts.module.js';
import { Migration1792123844537 } from '../src/database/migrations/1792123844537-Migration.js';
import { Migration1792126492933 } from '../src/database/migrations/1792126492933-Migration.js';
import { Migration1792160311524 } from '../src/database/migrations/1792160311524-Migration.js';
import { CreateWorkouts1792160584635 } from '../src/database/migrations/1792160584635-CreateWorkouts.js';

// This suite truncates fixtures. Use only a separate database with this exact name.
const databaseUrl = process.env.WORKOUT_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('Workouts API with PostgreSQL', () => {
  let app: INestApplication;
  let source: DataSource;
  let exerciseId: string;
  const sets = [{ weightKg: 50, reps: 10 }];

  beforeAll(async () => {
    if (new URL(databaseUrl!).pathname !== '/workouts_module_test') {
      throw new Error('Use a disposable workouts_module_test database');
    }
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: databaseUrl,
          schema: 'workouts',
          extra: { options: '-c search_path=workouts,public' },
          entities: [
            Exercise,
            MuscleGroup,
            Plan,
            PlanExercise,
            PlanSet,
            Workout,
            WorkoutExercise,
            WorkoutSet,
          ],
          migrations: [
            Migration1792123844537,
            Migration1792126492933,
            Migration1792160311524,
            CreateWorkouts1792160584635,
          ],
          synchronize: false,
          retryAttempts: 0,
        }),
        WorkoutsModule,
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
  });

  beforeEach(async () => {
    await source.query(
      'TRUNCATE workouts.plans, workouts.workouts, workouts.exercises CASCADE',
    );
    const response = await request(app.getHttpServer())
      .post('/exercises')
      .set('X-Dev-User', 'user1')
      .send({ title: 'Bench press', muscleGroups: [] })
      .expect(201);
    exerciseId = response.body.id;
  });

  function createWorkout(exercises = [{ exerciseId, sets }]) {
    return request(app.getHttpServer())
      .post('/workouts')
      .set('X-Dev-User', 'user1')
      .send({
        title: 'Chest',
        workoutDate: '2026-10-16',
        durationMinutes: 60,
        exercises,
      })
      .expect(201);
  }

  function getWorkout(id: string, user = 'user1') {
    return request(app.getHttpServer())
      .get(`/workouts/${id}`)
      .set('X-Dev-User', user);
  }

  it('saves nested sets and reads current catalog data without snapshots', async () => {
    const { body } = await createWorkout();
    expect(body.workoutDate).toBe('2026-10-16');
    expect(body.exercises[0].sets[0]).toMatchObject({
      weightKg: '50.00',
      reps: 10,
    });
    await request(app.getHttpServer())
      .put(`/exercises/${exerciseId}`)
      .set('X-Dev-User', 'user1')
      .send({ title: 'Renamed exercise', muscleGroups: [] })
      .expect(200);
    const fetched = await getWorkout(body.id).expect(200);
    expect(fetched.body.exercises[0].exercise.title).toBe('Renamed exercise');
    const columns = await source.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='workouts' AND table_name IN ('workouts','workout_exercises')",
    );
    expect(
      columns.some((column: { column_name: string }) =>
        /snapshot|source_plan/.test(column.column_name),
      ),
    ).toBe(false);
  });

  it('prevents other users and administrators from modifying a workout', async () => {
    const { body } = await createWorkout();
    for (const user of ['user2', 'admin']) {
      await getWorkout(body.id, user).expect(404);
      await request(app.getHttpServer())
        .put(`/workouts/${body.id}`)
        .set('X-Dev-User', user)
        .send({ title: 'Changed', workoutDate: '2026-10-16', exercises: [] })
        .expect(404);
      await request(app.getHttpServer())
        .post(`/workouts/${body.id}/exercises`)
        .set('X-Dev-User', user)
        .send({ exerciseId, sets })
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/workouts/${body.id}/exercises/${body.exercises[0].id}`)
        .set('X-Dev-User', user)
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/workouts/${body.id}`)
        .set('X-Dev-User', user)
        .expect(404);
    }
    const list = await request(app.getHttpServer())
      .get('/workouts')
      .set('X-Dev-User', 'user2')
      .expect(200);
    expect(list.body).toEqual([]);
  });

  it('rejects a private exercise belonging to another user without creating rows', async () => {
    await request(app.getHttpServer())
      .post('/workouts')
      .set('X-Dev-User', 'user2')
      .send({
        title: 'Invalid',
        workoutDate: '2026-10-16',
        exercises: [{ exerciseId, sets }],
      })
      .expect(400);
    expect(await source.getRepository(Workout).count()).toBe(0);
  });

  it('serializes simultaneous additions and removes only the specified inclusion', async () => {
    const { body } = await createWorkout([]);
    const add = () =>
      request(app.getHttpServer())
        .post(`/workouts/${body.id}/exercises`)
        .set('X-Dev-User', 'user1')
        .send({ exerciseId, sets })
        .expect(201);
    const [first, second] = await Promise.all([add(), add()]);
    expect(new Set([first.body.position, second.body.position]).size).toBe(2);
    const other = await createWorkout();
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${other.body.exercises[0].id}`)
      .set('X-Dev-User', 'user1')
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${first.body.id}`)
      .set('X-Dev-User', 'user1')
      .expect(204);
    const fetched = await getWorkout(body.id).expect(200);
    expect(
      fetched.body.exercises.map((item: { id: string }) => item.id),
    ).toEqual([second.body.id]);
    expect(await source.getRepository(Exercise).count()).toBe(1);
    expect(
      await source
        .getRepository(WorkoutSet)
        .countBy({ workoutExerciseId: first.body.id }),
    ).toBe(0);
  });

  it('keeps a workout and its source form independent from plan changes', async () => {
    const plan = await request(app.getHttpServer())
      .post('/plans')
      .set('X-Dev-User', 'user1')
      .send({ title: 'Plan', exercises: [{ exerciseId, sets }] })
      .expect(201);
    const { body } = await createWorkout();
    await request(app.getHttpServer())
      .put(`/workouts/${body.id}`)
      .set('X-Dev-User', 'user1')
      .send({
        title: 'Changed workout',
        workoutDate: '2026-10-17',
        durationMinutes: 70,
        exercises: [{ exerciseId, sets: [{ weightKg: 60, reps: 8 }] }],
      })
      .expect(200);
    const original = await request(app.getHttpServer())
      .get(`/plans/${plan.body.id}`)
      .set('X-Dev-User', 'user1')
      .expect(200);
    expect(original.body.exercises[0].sets[0].weightKg).toBe('50.00');
    await request(app.getHttpServer())
      .put(`/plans/${plan.body.id}`)
      .set('X-Dev-User', 'user1')
      .send({ title: 'Changed plan', exercises: [] })
      .expect(200);
    const fetched = await getWorkout(body.id).expect(200);
    expect(fetched.body.exercises[0].sets[0].weightKg).toBe('60.00');
  });

  it('rolls back replacement if a nested database insert fails', async () => {
    const { body } = await createWorkout();
    await source.query(
      'ALTER TABLE workouts.workout_sets ADD CONSTRAINT test_reps_limit CHECK (reps <= 10)',
    );
    try {
      await request(app.getHttpServer())
        .put(`/workouts/${body.id}`)
        .set('X-Dev-User', 'user1')
        .send({
          title: 'Must roll back',
          workoutDate: '2026-10-17',
          exercises: [{ exerciseId, sets: [{ weightKg: 80, reps: 20 }] }],
        })
        .expect(500);
      const fetched = await getWorkout(body.id).expect(200);
      expect(fetched.body.title).toBe('Chest');
      expect(fetched.body.exercises[0].id).toBe(body.exercises[0].id);
      expect(fetched.body.exercises[0].sets[0].reps).toBe(10);
    } finally {
      await source.query(
        'ALTER TABLE workouts.workout_sets DROP CONSTRAINT test_reps_limit',
      );
    }
  });

  it('cascades catalog deletion into workouts and plans without deleting their headers', async () => {
    const { body } = await createWorkout();
    await request(app.getHttpServer())
      .post('/plans')
      .set('X-Dev-User', 'user1')
      .send({ title: 'Plan', exercises: [{ exerciseId, sets }] })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/exercises/${exerciseId}`)
      .set('X-Dev-User', 'user1')
      .expect(200);
    expect(await source.getRepository(WorkoutExercise).count()).toBe(0);
    expect(await source.getRepository(WorkoutSet).count()).toBe(0);
    expect(await source.getRepository(PlanSet).count()).toBe(0);
    expect(await source.getRepository(Plan).count()).toBe(1);
    expect((await getWorkout(body.id).expect(200)).body.exercises).toEqual([]);
  });

  it('deletes workout children while preserving the catalog', async () => {
    const { body } = await createWorkout();
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}`)
      .set('X-Dev-User', 'user1')
      .expect(204);
    expect(await source.getRepository(WorkoutExercise).count()).toBe(0);
    expect(await source.getRepository(WorkoutSet).count()).toBe(0);
    expect(await source.getRepository(Exercise).count()).toBe(1);
  });
});
