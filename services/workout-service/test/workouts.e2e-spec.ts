import { ConfigService } from '@nestjs/config';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UserCleanupModule } from '../src/user-cleanup/user-cleanup.module.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { authorization, TestAuthModule } from './helpers/auth.js';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';

import {
  Exercise,
  ExerciseVisibility,
} from '../src/exercises/entities/exercise.entity.js';
import { MuscleGroup } from '../src/muscle-groups/entities/muscle-group.entity.js';
import { Plan } from '../src/plans/entities/plan.entity.js';
import { PlanExercise } from '../src/plans/entities/plan-exercise.entity.js';
import { PlanSet } from '../src/plans/entities/plan-set.entity.js';
import { PlansModule } from '../src/plans/plans.module.js';
import { Workout } from '../src/workouts/entities/workout.entity.js';
import { WorkoutExercise } from '../src/workouts/entities/workout-exercise.entity.js';
import { WorkoutSet } from '../src/workouts/entities/workout-set.entity.js';
import { MAX_WORKOUT_EXERCISES } from '../src/workouts/workout.policy.js';
import type { WorkoutView } from '../src/workouts/workout.types.js';
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
  let tokenDirectory: string;
  const internalToken = 'cleanup-test-secret';
  const sets = [{ weightKg: 50, reps: 10 }];

  beforeAll(async () => {
    if (new URL(databaseUrl!).pathname !== '/workouts_module_test') {
      throw new Error('Use a disposable workouts_module_test database');
    }
    tokenDirectory = mkdtempSync(join(tmpdir(), 'nero-cleanup-e2e-'));
    const tokenPath = join(tokenDirectory, 'token');
    writeFileSync(tokenPath, internalToken + '\n', { mode: 0o600 });
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
        UserCleanupModule,
        WorkoutsModule,
        PlansModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ INTERNAL_API_TOKEN_FILE: tokenPath }))
      .overrideModule(AuthModule)
      .useModule(TestAuthModule)
      .compile();
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
    if (tokenDirectory)
      rmSync(tokenDirectory, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await source.query(
      'TRUNCATE workouts.plans, workouts.workouts, workouts.exercises CASCADE',
    );
    const response = await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', authorization('user1'))
      .send({ title: 'Bench press', muscleGroups: [] })
      .expect(201);
    exerciseId = response.body.id;
  });

  function createWorkout(exercises = [{ exerciseId, sets }]) {
    return request(app.getHttpServer())
      .post('/workouts')
      .set('Authorization', authorization('user1'))
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
      .set('Authorization', authorization(user));
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
      .set('Authorization', authorization('user1'))
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
        .set('Authorization', authorization(user))
        .send({ title: 'Changed', workoutDate: '2026-10-16', exercises: [] })
        .expect(404);
      await request(app.getHttpServer())
        .post(`/workouts/${body.id}/exercises`)
        .set('Authorization', authorization(user))
        .send({ exerciseId, sets })
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/workouts/${body.id}/exercises/${body.exercises[0].id}`)
        .set('Authorization', authorization(user))
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/workouts/${body.id}`)
        .set('Authorization', authorization(user))
        .expect(404);
    }
    const list = await request(app.getHttpServer())
      .get('/workouts')
      .set('Authorization', authorization('user2'))
      .expect(200);
    expect(list.body).toEqual([]);
  });

  it('rejects a private exercise belonging to another user without creating rows', async () => {
    await request(app.getHttpServer())
      .post('/workouts')
      .set('Authorization', authorization('user2'))
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
        .set('Authorization', authorization('user1'))
        .send({ exerciseId, sets })
        .expect(201);
    const [first, second] = await Promise.all([add(), add()]);
    expect(
      [first.body.position, second.body.position].sort((a, b) => a - b),
    ).toEqual([1, 2]);
    const other = await createWorkout();
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${other.body.exercises[0].id}`)
      .set('Authorization', authorization('user1'))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${first.body.id}`)
      .set('Authorization', authorization('user1'))
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
      .set('Authorization', authorization('user1'))
      .send({ title: 'Plan', exercises: [{ exerciseId, sets }] })
      .expect(201);
    const { body } = await createWorkout();
    await request(app.getHttpServer())
      .put(`/workouts/${body.id}`)
      .set('Authorization', authorization('user1'))
      .send({
        title: 'Changed workout',
        workoutDate: '2026-10-17',
        durationMinutes: 70,
        exercises: [{ exerciseId, sets: [{ weightKg: 60, reps: 8 }] }],
      })
      .expect(200);
    const original = await request(app.getHttpServer())
      .get(`/plans/${plan.body.id}`)
      .set('Authorization', authorization('user1'))
      .expect(200);
    expect(original.body.exercises[0].sets[0].weightKg).toBe('50.00');
    await request(app.getHttpServer())
      .put(`/plans/${plan.body.id}`)
      .set('Authorization', authorization('user1'))
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
        .set('Authorization', authorization('user1'))
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
      .set('Authorization', authorization('user1'))
      .send({ title: 'Plan', exercises: [{ exerciseId, sets }] })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/exercises/${exerciseId}`)
      .set('Authorization', authorization('user1'))
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
      .set('Authorization', authorization('user1'))
      .expect(204);
    expect(await source.getRepository(WorkoutExercise).count()).toBe(0);
    expect(await source.getRepository(WorkoutSet).count()).toBe(0);
    expect(await source.getRepository(Exercise).count()).toBe(1);
  });
  it('lists headers by workout date, then creation time and ID without exposing inclusions', async () => {
    const first = (await createWorkout()).body as WorkoutView;
    const second = (await createWorkout([])).body as WorkoutView;
    const newest = (await createWorkout([])).body as WorkoutView;
    const repo = source.getRepository(Workout);
    await repo.update(first.id, {
      workoutDate: '2026-10-15',
      createdAt: new Date('2026-10-17T10:00:00Z'),
    });
    await repo.update(second.id, {
      workoutDate: '2026-10-16',
      createdAt: new Date('2026-10-17T09:00:00Z'),
    });
    await repo.update(newest.id, {
      workoutDate: '2026-10-16',
      createdAt: new Date('2026-10-17T11:00:00Z'),
    });
    const list = await request(app.getHttpServer())
      .get('/workouts')
      .set('Authorization', authorization('user1'))
      .expect(200);
    expect(list.body.map((item: WorkoutView) => item.id)).toEqual([
      newest.id,
      second.id,
      first.id,
    ]);
    for (const item of list.body) {
      expect(Object.keys(item).sort()).toEqual(
        [
          'id',
          'ownerId',
          'title',
          'description',
          'workoutDate',
          'durationMinutes',
          'createdAt',
          'updatedAt',
        ].sort(),
      );
    }
    await repo.update(second.id, {
      createdAt: new Date('2026-10-17T11:00:00Z'),
    });
    const tied = await request(app.getHttpServer())
      .get('/workouts')
      .set('Authorization', authorization('user1'))
      .expect(200);
    expect(tied.body.map((item: WorkoutView) => item.id)).toEqual(
      [[newest.id, second.id].sort().reverse(), first.id].flat(),
    );
  });

  it('replaces sets and inclusions completely, preserves zero duration and permits clearing the workout', async () => {
    const { body } = await createWorkout();
    const replacement = await request(app.getHttpServer())
      .put(`/workouts/${body.id}`)
      .set('Authorization', authorization('user1'))
      .send({
        title: '  Updated  ',
        workoutDate: '2026-10-18',
        durationMinutes: 0,
        description: '',
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 0, reps: 20 },
              { weightKg: 12.5, reps: 8 },
            ],
          },
          { exerciseId, sets: [] },
        ],
      })
      .expect(200);
    const view = replacement.body as WorkoutView;
    expect(view).toMatchObject({
      title: 'Updated',
      workoutDate: '2026-10-18',
      durationMinutes: 0,
      description: '',
    });
    expect(view.exercises.map((item) => item.position)).toEqual([1, 2]);
    expect(
      view.exercises[0].sets.map((set) => [
        set.position,
        set.weightKg,
        set.reps,
      ]),
    ).toEqual([
      [1, '0.00', 20],
      [2, '12.50', 8],
    ]);
    expect(view.exercises[1].sets).toEqual([]);
    expect(view.exercises[0].id).not.toBe(body.exercises[0].id);
    expect(
      await source
        .getRepository(WorkoutSet)
        .countBy({ workoutExerciseId: body.exercises[0].id }),
    ).toBe(0);
    const cleared = await request(app.getHttpServer())
      .put(`/workouts/${body.id}`)
      .set('Authorization', authorization('user1'))
      .send({ title: 'Empty', workoutDate: '2026-10-19', exercises: [] })
      .expect(200);
    expect(cleared.body).toMatchObject({
      exercises: [],
      description: null,
      durationMinutes: null,
    });
    expect(await source.getRepository(WorkoutExercise).count()).toBe(0);
    expect(await source.getRepository(WorkoutSet).count()).toBe(0);
  });

  it('rejects unavailable exercises on replacement and addition without changing existing data', async () => {
    const { body } = await createWorkout();
    const foreign = await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', authorization('user2'))
      .send({ title: 'Foreign private', muscleGroups: [] })
      .expect(201);
    const input = { exerciseId: foreign.body.id, sets };
    await request(app.getHttpServer())
      .put(`/workouts/${body.id}`)
      .set('Authorization', authorization('user1'))
      .send({ title: 'Invalid', workoutDate: '2026-10-17', exercises: [input] })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/workouts/${body.id}/exercises`)
      .set('Authorization', authorization('user1'))
      .send(input)
      .expect(404);
    expect((await getWorkout(body.id).expect(200)).body).toEqual(body);
  });

  it('serializes capacity checks so only one concurrent request can take slot 100', async () => {
    const { body } = await createWorkout(
      Array.from({ length: MAX_WORKOUT_EXERCISES - 1 }, () => ({
        exerciseId,
        sets: [],
      })),
    );
    const add = () =>
      request(app.getHttpServer())
        .post(`/workouts/${body.id}/exercises`)
        .set('Authorization', authorization('user1'))
        .send({ exerciseId, sets: [] });
    const responses = await Promise.all([add(), add()]);
    expect(
      responses.map((response) => response.status).sort((a, b) => a - b),
    ).toEqual([201, 400]);
    const view = (await getWorkout(body.id).expect(200)).body as WorkoutView;
    expect(view.exercises).toHaveLength(100);
    expect(view.exercises.map((item) => item.position)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1),
    );
  });

  it('appends after the highest position even when deletion leaves a gap', async () => {
    const { body } = await createWorkout(
      Array.from({ length: 3 }, () => ({ exerciseId, sets })),
    );
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${body.exercises[1].id}`)
      .set('Authorization', authorization('user1'))
      .expect(204);
    const added = await request(app.getHttpServer())
      .post(`/workouts/${body.id}/exercises`)
      .set('Authorization', authorization('user1'))
      .send({ exerciseId, sets })
      .expect(201);
    expect(added.body.position).toBe(4);
    const view = (await getWorkout(body.id).expect(200)).body as WorkoutView;
    expect(view.exercises.map((item) => item.position)).toEqual([1, 3, 4]);
  });

  it('rolls back addition and its timestamp when a nested insert fails', async () => {
    const { body } = await createWorkout();
    await source.query(
      'ALTER TABLE workouts.workout_sets ADD CONSTRAINT test_add_reps_limit CHECK (reps <= 10)',
    );
    try {
      await request(app.getHttpServer())
        .post(`/workouts/${body.id}/exercises`)
        .set('Authorization', authorization('user1'))
        .send({ exerciseId, sets: [{ weightKg: 80, reps: 20 }] })
        .expect(500);
      expect((await getWorkout(body.id).expect(200)).body).toEqual(body);
      expect(await source.getRepository(WorkoutExercise).count()).toBe(1);
      expect(await source.getRepository(WorkoutSet).count()).toBe(1);
    } finally {
      await source.query(
        'ALTER TABLE workouts.workout_sets DROP CONSTRAINT test_add_reps_limit',
      );
    }
  });

  it('returns 404 for missing headers and inclusions without changing existing data', async () => {
    const { body } = await createWorkout();
    const missing = '99999999-9999-4999-8999-999999999999';
    await getWorkout(missing).expect(404);
    await request(app.getHttpServer())
      .put(`/workouts/${missing}`)
      .set('Authorization', authorization('user1'))
      .send({ title: 'Missing', workoutDate: '2026-10-17', exercises: [] })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/workouts/${missing}/exercises`)
      .set('Authorization', authorization('user1'))
      .send({ exerciseId, sets })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/workouts/${missing}/exercises/${missing}`)
      .set('Authorization', authorization('user1'))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/workouts/${body.id}/exercises/${missing}`)
      .set('Authorization', authorization('user1'))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/workouts/${missing}`)
      .set('Authorization', authorization('user1'))
      .expect(404);
    expect((await getWorkout(body.id).expect(200)).body).toEqual(body);
  });

  it('cleans owned graphs, preserves other users and public exercises, and permits retries', async () => {
    const owner = '11111111-1111-4111-8111-111111111111';
    const otherOwner = '22222222-2222-4222-8222-222222222222';
    const workout = (await createWorkout().expect(201)).body;
    const plan = (
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', authorization('user1'))
        .send({ title: 'Owned plan', exercises: [{ exerciseId, sets }] })
        .expect(201)
    ).body;
    const otherExercise = await source.getRepository(Exercise).save({
      ownerId: otherOwner,
      title: 'Other private exercise',
    });
    const publicExercise = await source.getRepository(Exercise).save({
      ownerId: owner,
      title: 'Shared exercise',
      visibility: ExerciseVisibility.PUBLIC,
    });
    const otherPlan = await source.getRepository(Plan).save({
      ownerId: otherOwner,
      title: 'Other plan',
    });
    const otherWorkout = await source.getRepository(Workout).save({
      ownerId: otherOwner,
      title: 'Other workout',
      workoutDate: '2026-10-18',
    });
    const group = (await source.getRepository(MuscleGroup).find())[0];
    await source
      .createQueryBuilder()
      .relation(Exercise, 'muscleGroups')
      .of(exerciseId)
      .add(group.id);

    for (let attempt = 0; attempt < 2; attempt++) {
      await request(app.getHttpServer())
        .delete(`/internal/users/${owner}`)
        .set('X-Internal-Token', internalToken)
        .expect(204);
    }
    expect(
      await source.getRepository(Workout).findOneBy({ id: workout.id }),
    ).toBeNull();
    expect(
      await source.getRepository(Plan).findOneBy({ id: plan.id }),
    ).toBeNull();
    expect(
      await source.getRepository(Exercise).findOneBy({ id: exerciseId }),
    ).toBeNull();
    expect(await source.getRepository(WorkoutExercise).count()).toBe(0);
    expect(await source.getRepository(WorkoutSet).count()).toBe(0);
    expect(await source.getRepository(PlanExercise).count()).toBe(0);
    expect(await source.getRepository(PlanSet).count()).toBe(0);
    expect(
      await source.query('SELECT * FROM workouts.exercise_muscle_groups'),
    ).toEqual([]);
    expect(
      await source.getRepository(Exercise).findOneBy({ id: otherExercise.id }),
    ).not.toBeNull();
    expect(
      await source.getRepository(Exercise).findOneBy({ id: publicExercise.id }),
    ).not.toBeNull();
    expect(
      await source.getRepository(Plan).findOneBy({ id: otherPlan.id }),
    ).not.toBeNull();
    expect(
      await source.getRepository(Workout).findOneBy({ id: otherWorkout.id }),
    ).not.toBeNull();
    expect(
      await source.getRepository(MuscleGroup).findOneBy({ id: group.id }),
    ).not.toBeNull();
  });

  it('rolls back plans and workouts when private exercise deletion fails', async () => {
    const owner = '11111111-1111-4111-8111-111111111111';
    const workout = (await createWorkout().expect(201)).body;
    const plan = (
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', authorization('user1'))
        .send({ title: 'Plan', exercises: [{ exerciseId, sets }] })
        .expect(201)
    ).body;
    await source.query(`CREATE FUNCTION workouts.reject_cleanup_test() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test cleanup failure'; END $$`);
    await source.query(`CREATE TRIGGER reject_cleanup_test BEFORE DELETE ON workouts.exercises
      FOR EACH ROW EXECUTE FUNCTION workouts.reject_cleanup_test()`);
    try {
      await request(app.getHttpServer())
        .delete(`/internal/users/${owner}`)
        .set('X-Internal-Token', internalToken)
        .expect(500);
      expect(
        await source.getRepository(Workout).findOneBy({ id: workout.id }),
      ).not.toBeNull();
      expect(
        await source.getRepository(Plan).findOneBy({ id: plan.id }),
      ).not.toBeNull();
      expect(
        await source.getRepository(Exercise).findOneBy({ id: exerciseId }),
      ).not.toBeNull();
      expect(await source.getRepository(WorkoutSet).count()).toBe(sets.length);
      expect(await source.getRepository(PlanSet).count()).toBe(sets.length);
    } finally {
      await source.query(
        'DROP TRIGGER reject_cleanup_test ON workouts.exercises',
      );
      await source.query('DROP FUNCTION workouts.reject_cleanup_test()');
    }
  });
});
