import { Test } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth-user.js';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';

describe('PlansController owner forwarding', () => {
  it('forwards the authenticated owner, resource IDs and payloads for every operation', async () => {
    const result = { id: 'plan' };
    const service = Object.fromEntries(
      [
        'findMine',
        'findOne',
        'create',
        'update',
        'addExercise',
        'removeExercise',
        'delete',
      ].map((name) => [name, vi.fn().mockResolvedValue(result)]),
    );
    const module = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [{ provide: PlansService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(PlansController);
    const user: AuthUser = { id: 'owner', role: 'standard' };
    const dto = { title: 'Plan', exercises: [] };
    const addition = { exerciseId: 'catalog', sets: [] };
    try {
      await expect(controller.findMine(user)).resolves.toBe(result);
      expect(service.findMine).toHaveBeenCalledExactlyOnceWith('owner');
      await expect(controller.findOne(user, 'plan')).resolves.toBe(result);
      expect(service.findOne).toHaveBeenCalledExactlyOnceWith('owner', 'plan');
      await expect(controller.create(user, dto)).resolves.toBe(result);
      expect(service.create).toHaveBeenCalledExactlyOnceWith('owner', dto);
      await expect(controller.update(user, 'plan', dto)).resolves.toBe(result);
      expect(service.update).toHaveBeenCalledExactlyOnceWith(
        'owner',
        'plan',
        dto,
      );
      await expect(
        controller.addExercise(user, 'plan', addition),
      ).resolves.toBe(result);
      expect(service.addExercise).toHaveBeenCalledExactlyOnceWith(
        'owner',
        'plan',
        addition,
      );
      await expect(
        controller.removeExercise(user, 'plan', 'inclusion'),
      ).resolves.toBe(result);
      expect(service.removeExercise).toHaveBeenCalledExactlyOnceWith(
        'owner',
        'plan',
        'inclusion',
      );
      await expect(controller.delete(user, 'plan')).resolves.toBe(result);
      expect(service.delete).toHaveBeenCalledExactlyOnceWith('owner', 'plan');
    } finally {
      await module.close();
    }
  });
});
