import { Test } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth-user.js';
import { FindExerciseDto } from './dto/find-exercise.dto.js';
import { ExercisesController } from './exercises.controller.js';
import { ExercisesService } from './exercises.service.js';

async function setup() {
  const service = {
    findManyForUser: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const module = await Test.createTestingModule({
    controllers: [ExercisesController],
    providers: [{ provide: ExercisesService, useValue: service }],
  })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .compile();
  return { controller: module.get(ExercisesController), service };
}

const user: AuthUser = { id: 'owner', role: 'standard' };
const dto = { title: 'Squat', muscleGroups: ['legs'] };

describe('ExercisesController', () => {
  it('passes the authenticated user and filters to the list service', async () => {
    const { controller, service } = await setup();
    const query = new FindExerciseDto();
    const page = { data: [], meta: { total: 0 } };
    service.findManyForUser.mockResolvedValue(page);
    await expect(controller.findForUser(user, query)).resolves.toBe(page);
    expect(service.findManyForUser).toHaveBeenCalledWith('owner', query);
  });

  it('passes user and exercise IDs to the detail service', async () => {
    const { controller, service } = await setup();
    const view = { id: 'exercise' };
    service.findOne.mockResolvedValue(view);
    await expect(controller.findOne(user, 'exercise')).resolves.toBe(view);
    expect(service.findOne).toHaveBeenCalledWith('owner', 'exercise');
  });

  it.each(['standard', 'admin'] as const)(
    'passes the %s role when creating and updating',
    async (role) => {
      const { controller, service } = await setup();
      const currentUser = { ...user, role };
      const view = { id: 'exercise' };
      service.create.mockResolvedValue(view);
      service.update.mockResolvedValue(view);
      await expect(controller.create(currentUser, dto)).resolves.toBe(view);
      await expect(
        controller.update(currentUser, 'exercise', dto),
      ).resolves.toBe(view);
      expect(service.create).toHaveBeenCalledWith(
        'owner',
        dto,
        role === 'admin',
      );
      expect(service.update).toHaveBeenCalledWith(
        'owner',
        'exercise',
        dto,
        role === 'admin',
      );
    },
  );

  it('deletes on behalf of the authenticated user', async () => {
    const { controller, service } = await setup();
    service.delete.mockResolvedValue(undefined);
    await expect(controller.delete(user, 'exercise')).resolves.toBeUndefined();
    expect(service.delete).toHaveBeenCalledWith('owner', 'exercise');
  });

  it('propagates service failures', async () => {
    const { controller, service } = await setup();
    const error = new Error('Unavailable exercise');
    service.findOne.mockRejectedValue(error);
    await expect(controller.findOne(user, 'missing')).rejects.toBe(error);
  });
});
