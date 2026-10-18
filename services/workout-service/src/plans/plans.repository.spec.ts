import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity.js';
import { PlanExercise } from './entities/plan-exercise.entity.js';
import { PlansRepository } from './plans.repository.js';
import type { PlanValues } from './plan.types.js';

const values: PlanValues = {
  title: 'Legs',
  description: 'Notes',
  exercises: [
    {
      exerciseId: 'catalog',
      position: 1,
      sets: [{ position: 1, weightKg: '12.50', reps: 8 }],
    },
  ],
};
const now = new Date('2026-10-17T12:00:00Z');

function setup() {
  const plan = Object.assign(new Plan(), {
    id: 'plan',
    ownerId: 'owner',
    ...values,
  });
  const inclusion = Object.assign(new PlanExercise(), {
    id: 'inclusion',
    planId: 'plan',
    ...values.exercises[0],
  });
  const orm = {
    find: vi.fn().mockResolvedValue([plan]),
    findOne: vi.fn().mockResolvedValue(plan),
    existsBy: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockReturnValue(plan),
    save: vi.fn().mockResolvedValue(plan),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  // Transaction repositories are distinct from the outer repository. Writes must use the transaction manager.
  const headers = {
    findOne: vi.fn().mockResolvedValue(plan),
    create: vi.fn().mockReturnValue(plan),
    save: vi.fn().mockResolvedValue(plan),
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
      if (entity === Plan) return headers;
      if (entity === PlanExercise) return inclusions;
      throw new Error('Unexpected repository');
    }),
  };
  const source = {
    transaction: vi.fn(
      async (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(manager as unknown as EntityManager),
    ),
  };
  const repository = new PlansRepository(
    orm as unknown as Repository<Plan>,
    source as unknown as DataSource,
  );
  return { repository, orm, headers, inclusions, source, plan, inclusion };
}

function expectLock(headers: ReturnType<typeof setup>['headers']) {
  expect(headers.findOne).toHaveBeenCalledWith({
    where: { id: 'plan', ownerId: 'owner' },
    lock: { mode: 'pessimistic_write' },
  });
}

describe('PlansRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects owner-scoped headers ordered by creation time and ID', async () => {
    const { repository, orm, plan } = setup();
    await expect(repository.findMine('owner')).resolves.toEqual([plan]);
    expect(orm.find).toHaveBeenCalledWith({
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { ownerId: 'owner' },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  });

  it('loads owned details with ordered inclusions and sets', async () => {
    const { repository, orm, plan } = setup();
    await expect(repository.findOwnedById('owner', 'plan')).resolves.toBe(plan);
    expect(orm.findOne).toHaveBeenCalledWith({
      where: { id: 'plan', ownerId: 'owner' },
      relations: { planExercises: { sets: true } },
      order: { planExercises: { position: 'ASC', sets: { position: 'ASC' } } },
    });
  });

  it.each([true, false])(
    'returns ownership result %s without dropping the owner filter',
    async (exists) => {
      const { repository, orm } = setup();
      orm.existsBy.mockResolvedValue(exists);
      await expect(repository.existsOwned('owner', 'plan')).resolves.toBe(
        exists,
      );
      expect(orm.existsBy).toHaveBeenCalledWith({
        id: 'plan',
        ownerId: 'owner',
      });
    },
  );

  it('persists the header and nested values with the authenticated owner', async () => {
    const { repository, orm, plan } = setup();
    await expect(repository.create('owner', values)).resolves.toBe(plan);
    expect(orm.create).toHaveBeenCalledWith({
      ownerId: 'owner',
      title: values.title,
      description: values.description,
      planExercises: values.exercises,
    });
    expect(orm.save).toHaveBeenCalledWith(plan);
  });

  it('locks ownership and replaces children and all header values inside the transaction', async () => {
    const { repository, orm, headers, inclusions, source, plan } = setup();
    await expect(
      repository.replaceOwned('owner', 'plan', values),
    ).resolves.toBeUndefined();
    expect(source.transaction).toHaveBeenCalledOnce();
    expectLock(headers);
    expect(inclusions.delete).toHaveBeenCalledWith({ planId: 'plan' });
    expect(headers.create).toHaveBeenCalledWith({
      id: 'plan',
      ownerId: 'owner',
      title: values.title,
      description: values.description,
      planExercises: values.exercises,
      updatedAt: now,
    });
    expect(headers.save).toHaveBeenCalledWith(plan);
    expect(orm.save).not.toHaveBeenCalled();
    expect(headers.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      inclusions.delete.mock.invocationCallOrder[0],
    );
    expect(inclusions.delete.mock.invocationCallOrder[0]).toBeLessThan(
      headers.save.mock.invocationCallOrder[0],
    );
  });

  it.each(['replace', 'append', 'remove'] as const)(
    'rejects a missing or foreign plan under the transaction lock during %s',
    async (operation) => {
      const { repository, headers, inclusions } = setup();
      headers.findOne.mockResolvedValue(null);
      const action =
        operation === 'replace'
          ? repository.replaceOwned('owner', 'plan', values)
          : operation === 'append'
            ? repository.appendExercise('owner', 'plan', values.exercises[0])
            : repository.removeExercise('owner', 'plan', 'inclusion');
      await expect(action).rejects.toThrow(
        new NotFoundException('Plan not found'),
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
        repository.appendExercise('owner', 'plan', input),
      ).resolves.toBe(inclusion);
      expect(source.transaction).toHaveBeenCalledOnce();
      expectLock(headers);
      expect(inclusions.countBy).toHaveBeenCalledWith({ planId: 'plan' });
      expect(inclusions.findOne).toHaveBeenCalledWith({
        where: { planId: 'plan' },
        order: { position: 'DESC' },
      });
      expect(inclusions.create).toHaveBeenCalledWith({
        planId: 'plan',
        ...values.exercises[0],
        position: last ? 8 : 1,
      });
      expect(inclusions.save).toHaveBeenCalledWith(inclusion);
      expect(headers.update).toHaveBeenCalledWith(
        { id: 'plan' },
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
    inclusions.countBy.mockResolvedValue(199);
    await repository.appendExercise('owner', 'plan', values.exercises[0]);
    expect(inclusions.save).toHaveBeenCalledOnce();
  });

  it('checks capacity inside the transaction before assigning a position or saving', async () => {
    const { repository, headers, inclusions } = setup();
    inclusions.countBy.mockResolvedValue(200);
    await expect(
      repository.appendExercise('owner', 'plan', values.exercises[0]),
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
      repository.appendExercise('owner', 'plan', values.exercises[0]),
    ).rejects.toBe(error);
    expect(headers.update).not.toHaveBeenCalled();
  });

  it('deletes only the inclusion belonging to the locked plan and touches the header', async () => {
    const { repository, headers, inclusions, source } = setup();
    await expect(
      repository.removeExercise('owner', 'plan', 'inclusion'),
    ).resolves.toBeUndefined();
    expect(source.transaction).toHaveBeenCalledOnce();
    expectLock(headers);
    expect(inclusions.delete).toHaveBeenCalledWith({
      id: 'inclusion',
      planId: 'plan',
    });
    expect(headers.update).toHaveBeenCalledWith(
      { id: 'plan' },
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
        repository.removeExercise('owner', 'plan', 'missing'),
      ).rejects.toThrow(
        new NotFoundException('Exercise not found in this plan'),
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
      await expect(repository.deleteOwned('owner', 'plan')).resolves.toBe(
        expected,
      );
      expect(orm.delete).toHaveBeenCalledWith({
        id: 'plan',
        ownerId: 'owner',
      });
    },
  );
});

describe('plans account cleanup persistence', () => {
  it('deletes only the requested owner data using the supplied transaction', async () => {
    const { repository, orm } = setup();
    const remove = vi.fn().mockResolvedValue({ affected: 0 });
    const manager = { delete: remove } as unknown as EntityManager;
    await expect(
      repository.deleteAllForUser('owner', manager),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledExactlyOnceWith(Plan, { ownerId: 'owner' });
    expect(orm.delete).not.toHaveBeenCalled();
    const error = new Error('Delete failed');
    remove.mockRejectedValue(error);
    await expect(repository.deleteAllForUser('owner', manager)).rejects.toBe(
      error,
    );
  });
});
