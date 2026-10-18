import type { DataSource, EntityManager } from 'typeorm';
import type { ExercisesService } from '../exercises/exercises.service.js';
import type { PlansService } from '../plans/plans.service.js';
import type { WorkoutsService } from '../workouts/workouts.service.js';
import { UserCleanupService } from './user-cleanup.service.js';

function setup() {
  const manager = {} as EntityManager;
  const workouts = { deleteAllForUser: vi.fn().mockResolvedValue(undefined) };
  const plans = { deleteAllForUser: vi.fn().mockResolvedValue(undefined) };
  const exercises = {
    deletePrivateForUser: vi.fn().mockResolvedValue(undefined),
  };
  const source = {
    transaction: vi.fn(
      async (callback: (manager: EntityManager) => Promise<void>) =>
        callback(manager),
    ),
  };
  const service = new UserCleanupService(
    source as unknown as DataSource,
    workouts as unknown as WorkoutsService,
    plans as unknown as PlansService,
    exercises as unknown as ExercisesService,
  );
  return { service, source, manager, workouts, plans, exercises };
}

describe('UserCleanupService', () => {
  it('uses one transaction manager and deletes containers before catalog exercises', async () => {
    const { service, source, manager, workouts, plans, exercises } = setup();
    await expect(service.deleteUserData('owner')).resolves.toBeUndefined();
    expect(source.transaction).toHaveBeenCalledOnce();
    for (const operation of [
      workouts.deleteAllForUser,
      plans.deleteAllForUser,
      exercises.deletePrivateForUser,
    ]) {
      expect(operation).toHaveBeenCalledExactlyOnceWith('owner', manager);
    }
    expect(workouts.deleteAllForUser.mock.invocationCallOrder[0]).toBeLessThan(
      plans.deleteAllForUser.mock.invocationCallOrder[0],
    );
    expect(plans.deleteAllForUser.mock.invocationCallOrder[0]).toBeLessThan(
      exercises.deletePrivateForUser.mock.invocationCallOrder[0],
    );
  });

  it.each(['workouts', 'plans', 'exercises'] as const)(
    'propagates %s failures to the transaction and stops subsequent deletions',
    async (stage) => {
      const { service, workouts, plans, exercises } = setup();
      const operations = [
        workouts.deleteAllForUser,
        plans.deleteAllForUser,
        exercises.deletePrivateForUser,
      ];
      const index = ['workouts', 'plans', 'exercises'].indexOf(stage);
      const error = new Error('Cleanup failed');
      operations[index].mockRejectedValue(error);
      await expect(service.deleteUserData('owner')).rejects.toBe(error);
      for (const operation of operations.slice(index + 1))
        expect(operation).not.toHaveBeenCalled();
    },
  );

  it('waits for the database transaction to commit before reporting success', async () => {
    const { service, source } = setup();
    const error = new Error('Commit failed');
    source.transaction.mockRejectedValue(error);
    await expect(service.deleteUserData('owner')).rejects.toBe(error);
  });
});
