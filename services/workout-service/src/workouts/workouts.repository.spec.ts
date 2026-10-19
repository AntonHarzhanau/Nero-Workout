import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutsRepository } from './workouts.repository.js';
import type { WorkoutValues } from './workout.types.js';

const values: WorkoutValues = {
  title: 'Legs',
  description: 'Notes',
  workoutDate: '2026-10-17',
  durationMinutes: 0,
  exercises: [
    {
      exerciseId: 'catalog',
      exerciseNameSnapshot: 'Squat',
      muscleGroupsSnapshot: ['core', 'legs'],
      position: 1,
      sets: [{ position: 1, weightKg: '12.50', reps: 8 }],
    },
  ],
};
const now = new Date('2026-10-17T12:00:00Z');

function setup() {
  const workout = Object.assign(new Workout(), {
    id: 'workout',
    ownerId: 'owner',
    ...values,
  });
  const inclusion = Object.assign(new WorkoutExercise(), {
    id: 'inclusion',
    workoutId: 'workout',
    ...values.exercises[0],
  });
  const orm = {
    find: vi.fn().mockResolvedValue([workout]),
    findOne: vi.fn().mockResolvedValue(workout),
    existsBy: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockReturnValue(workout),
    save: vi.fn().mockResolvedValue(workout),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  // Transaction repositories are distinct from the outer repository. Writes must use the transaction manager.
  const headers = {
    findOne: vi.fn().mockResolvedValue(workout),
    create: vi.fn().mockReturnValue(workout),
    save: vi.fn().mockResolvedValue(workout),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const inclusions = {
    countBy: vi.fn().mockResolvedValue(0),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockReturnValue(inclusion),
    save: vi.fn().mockResolvedValue(inclusion),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = {
    getRepository: vi.fn((entity: unknown) => {
      if (entity === Workout) return headers;
      if (entity === WorkoutExercise) return inclusions;
      throw new Error('Unexpected repository');
    }),
  };
  const source = {
    transaction: vi.fn(
      async (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(manager as unknown as EntityManager),
    ),
  };
  const repository = new WorkoutsRepository(
    orm as unknown as Repository<Workout>,
    source as unknown as DataSource,
  );
  return { repository, orm, headers, inclusions, source, workout, inclusion };
}

function expectLock(headers: ReturnType<typeof setup>['headers']) {
  expect(headers.findOne).toHaveBeenCalledWith({
    where: { id: 'workout', ownerId: 'owner' },
    lock: { mode: 'pessimistic_write' },
  });
}

describe('WorkoutsRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects owner-scoped headers ordered by workout date, creation time and ID', async () => {
    const { repository, orm, workout } = setup();
    await expect(repository.findMine('owner')).resolves.toEqual([workout]);
    expect(orm.find).toHaveBeenCalledWith({
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        workoutDate: true,
        durationMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { ownerId: 'owner' },
      order: { workoutDate: 'DESC', createdAt: 'DESC', id: 'DESC' },
    });
  });

  it('loads owned details with ordered inclusions and sets', async () => {
    const { repository, orm, workout } = setup();
    await expect(repository.findOwnedById('owner', 'workout')).resolves.toBe(
      workout,
    );
    expect(orm.findOne).toHaveBeenCalledWith({
      where: { id: 'workout', ownerId: 'owner' },
      relations: { exercises: { sets: true } },
      order: { exercises: { position: 'ASC', sets: { position: 'ASC' } } },
    });
  });

  it.each([
    [{}, undefined],
    [{ from: '2026-10-01' }, MoreThanOrEqual('2026-10-01')],
    [{ to: '2026-10-31' }, LessThanOrEqual('2026-10-31')],
    [
      { from: '2026-10-01', to: '2026-10-31' },
      Between('2026-10-01', '2026-10-31'),
    ],
    [
      { from: '2026-10-15', to: '2026-10-15' },
      Between('2026-10-15', '2026-10-15'),
    ],
  ])(
    'loads all statistics data for only the requested owner and inclusive range %j',
    async (range, workoutDate) => {
      const { repository, orm, workout } = setup();
      await expect(
        repository.findForStatistics('statistics-owner', range),
      ).resolves.toEqual([workout]);
      expect(orm.find).toHaveBeenCalledExactlyOnceWith({
        where: {
          ownerId: 'statistics-owner',
          ...(workoutDate ? { workoutDate } : {}),
        },
        relations: { exercises: { sets: true } },
        order: {
          workoutDate: 'ASC',
          id: 'ASC',
          exercises: { position: 'ASC', sets: { position: 'ASC' } },
        },
      });
    },
  );

  it('propagates statistics query failures', async () => {
    const { repository, orm } = setup();
    const error = new Error('Statistics database failure');
    orm.find.mockRejectedValue(error);
    await expect(repository.findForStatistics('owner', {})).rejects.toBe(error);
  });

  it.each([true, false])(
    'returns ownership result %s without dropping the owner filter',
    async (exists) => {
      const { repository, orm } = setup();
      orm.existsBy.mockResolvedValue(exists);
      await expect(repository.existsOwned('owner', 'workout')).resolves.toBe(
        exists,
      );
      expect(orm.existsBy).toHaveBeenCalledWith({
        id: 'workout',
        ownerId: 'owner',
      });
    },
  );

  it('persists the header and nested values with the authenticated owner', async () => {
    const { repository, orm, workout } = setup();
    await expect(repository.create('owner', values)).resolves.toBe(workout);
    expect(orm.create).toHaveBeenCalledWith({ ownerId: 'owner', ...values });
    expect(orm.save).toHaveBeenCalledWith(workout);
  });

  it('locks ownership and replaces children and all header values inside the transaction', async () => {
    const { repository, orm, headers, inclusions, source, workout } = setup();
    await expect(
      repository.replaceOwned('owner', 'workout', values),
    ).resolves.toBeUndefined();
    expect(source.transaction).toHaveBeenCalledOnce();
    expectLock(headers);
    expect(inclusions.delete).toHaveBeenCalledWith({ workoutId: 'workout' });
    expect(headers.create).toHaveBeenCalledWith({
      id: 'workout',
      ownerId: 'owner',
      ...values,
      updatedAt: now,
    });
    expect(headers.save).toHaveBeenCalledWith(workout);
    expect(orm.save).not.toHaveBeenCalled();
    expect(headers.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      inclusions.delete.mock.invocationCallOrder[0],
    );
    expect(inclusions.delete.mock.invocationCallOrder[0]).toBeLessThan(
      headers.save.mock.invocationCallOrder[0],
    );
  });

  it.each(['replace', 'append', 'remove'] as const)(
    'rejects a missing or foreign workout under the transaction lock during %s',
    async (operation) => {
      const { repository, headers, inclusions } = setup();
      headers.findOne.mockResolvedValue(null);
      const action =
        operation === 'replace'
          ? repository.replaceOwned('owner', 'workout', values)
          : operation === 'append'
            ? repository.appendExercise('owner', 'workout', values.exercises[0])
            : repository.removeExercise('owner', 'workout', 'inclusion');
      await expect(action).rejects.toThrow(
        new NotFoundException('Workout not found'),
      );
      expectLock(headers);
      expect(inclusions.delete).not.toHaveBeenCalled();
      expect(inclusions.countBy).not.toHaveBeenCalled();
      expect(inclusions.save).not.toHaveBeenCalled();
      expect(headers.save).not.toHaveBeenCalled();
      expect(headers.update).not.toHaveBeenCalled();
    },
  );

  it.each([null, { position: 7 }])(
    'allocates the next position from the last inclusion %j under the lock',
    async (last) => {
      const { repository, headers, inclusions, inclusion, source } = setup();
      inclusions.findOne.mockResolvedValue(last);
      // A client-supplied position must not override the allocation.
      const input = { ...values.exercises[0], position: 999 };
      await expect(
        repository.appendExercise('owner', 'workout', input),
      ).resolves.toBe(inclusion);
      expect(source.transaction).toHaveBeenCalledOnce();
      expectLock(headers);
      expect(inclusions.countBy).toHaveBeenCalledWith({ workoutId: 'workout' });
      expect(inclusions.findOne).toHaveBeenCalledWith({
        where: { workoutId: 'workout' },
        order: { position: 'DESC' },
      });
      expect(inclusions.create).toHaveBeenCalledWith({
        workoutId: 'workout',
        ...values.exercises[0],
        position: last ? 8 : 1,
      });
      expect(inclusions.save).toHaveBeenCalledWith(inclusion);
      expect(headers.update).toHaveBeenCalledWith(
        { id: 'workout' },
        { updatedAt: now },
      );
      expect(headers.findOne.mock.invocationCallOrder[0]).toBeLessThan(
        inclusions.countBy.mock.invocationCallOrder[0],
      );
      expect(inclusions.save.mock.invocationCallOrder[0]).toBeLessThan(
        headers.update.mock.invocationCallOrder[0],
      );
    },
  );

  it('accepts the last available slot', async () => {
    const { repository, inclusions } = setup();
    inclusions.countBy.mockResolvedValue(99);
    await repository.appendExercise('owner', 'workout', values.exercises[0]);
    expect(inclusions.save).toHaveBeenCalledOnce();
  });

  it('checks capacity inside the transaction before assigning a position or saving', async () => {
    const { repository, headers, inclusions } = setup();
    inclusions.countBy.mockResolvedValue(100);
    await expect(
      repository.appendExercise('owner', 'workout', values.exercises[0]),
    ).rejects.toThrow(BadRequestException);
    expect(inclusions.findOne).not.toHaveBeenCalled();
    expect(inclusions.save).not.toHaveBeenCalled();
    expect(headers.update).not.toHaveBeenCalled();
  });

  it('does not update the header timestamp if inserting an inclusion fails', async () => {
    const { repository, headers, inclusions } = setup();
    const error = new Error('Insert failed');
    inclusions.save.mockRejectedValue(error);
    await expect(
      repository.appendExercise('owner', 'workout', values.exercises[0]),
    ).rejects.toBe(error);
    expect(headers.update).not.toHaveBeenCalled();
  });

  it('deletes only the inclusion belonging to the locked workout and touches the header', async () => {
    const { repository, headers, inclusions, source } = setup();
    await expect(
      repository.removeExercise('owner', 'workout', 'inclusion'),
    ).resolves.toBeUndefined();
    expect(source.transaction).toHaveBeenCalledOnce();
    expectLock(headers);
    expect(inclusions.delete).toHaveBeenCalledWith({
      id: 'inclusion',
      workoutId: 'workout',
    });
    expect(headers.update).toHaveBeenCalledWith(
      { id: 'workout' },
      { updatedAt: now },
    );
    expect(headers.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      inclusions.delete.mock.invocationCallOrder[0],
    );
  });

  it.each([0, undefined])(
    'returns 404 and does not touch the header when deletion affects %s rows',
    async (affected) => {
      const { repository, headers, inclusions } = setup();
      inclusions.delete.mockResolvedValue({ affected });
      await expect(
        repository.removeExercise('owner', 'workout', 'missing'),
      ).rejects.toThrow(
        new NotFoundException('Exercise not found in this workout'),
      );
      expect(headers.update).not.toHaveBeenCalled();
    },
  );

  it.each([
    [0, false],
    [1, true],
    [undefined, false],
  ] as const)(
    'reports deletion of %s rows as %s',
    async (affected, expected) => {
      const { repository, orm } = setup();
      orm.delete.mockResolvedValue({ affected });
      await expect(repository.deleteOwned('owner', 'workout')).resolves.toBe(
        expected,
      );
      expect(orm.delete).toHaveBeenCalledWith({
        id: 'workout',
        ownerId: 'owner',
      });
    },
  );
});

describe('workouts account cleanup persistence', () => {
  it('deletes only the requested owner data using the supplied transaction', async () => {
    const { repository, orm } = setup();
    const remove = vi.fn().mockResolvedValue({ affected: 0 });
    const manager = { delete: remove } as unknown as EntityManager;
    await expect(
      repository.deleteAllForUser('owner', manager),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledExactlyOnceWith(Workout, {
      ownerId: 'owner',
    });
    expect(orm.delete).not.toHaveBeenCalled();
    const error = new Error('Delete failed');
    remove.mockRejectedValue(error);
    await expect(repository.deleteAllForUser('owner', manager)).rejects.toBe(
      error,
    );
  });
});
