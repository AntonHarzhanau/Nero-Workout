import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { ExercisesService } from '../exercises/exercises.service.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutsService } from './workouts.service.js';

describe('WorkoutsService permissions', () => {
  const dto = {
    title: 'Workout',
    workoutDate: '2026-10-16',
    exercises: [{ exerciseId: 'exercise', sets: [] }],
  };

  function setup() {
    const repository = {
      existsBy: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue({ affected: 0 }),
      save: vi.fn(),
    };
    const exercises = { assertAvailableToUser: vi.fn(), findOne: vi.fn() };
    const source = { transaction: vi.fn() };
    const service = new WorkoutsService(
      repository as unknown as Repository<Workout>,
      exercises as unknown as ExercisesService,
      source as unknown as DataSource,
    );
    return { service, repository, exercises, source };
  }

  it('rejects unavailable exercises before writing a workout', async () => {
    const { service, repository, exercises } = setup();
    exercises.assertAvailableToUser.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(service.create('owner', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not update another user’s workout', async () => {
    const { service, exercises, source } = setup();
    await expect(
      service.update('other', 'workout', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(exercises.assertAvailableToUser).not.toHaveBeenCalled();
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('does not add exercises to another user’s workout', async () => {
    const { service, exercises, source } = setup();
    await expect(
      service.addExercise('other', 'workout', dto.exercises[0]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(exercises.findOne).not.toHaveBeenCalled();
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('scopes deletion to the owner even for an administrator', async () => {
    const { service, repository } = setup();
    await expect(service.delete('admin', 'workout')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.delete).toHaveBeenCalledWith({
      id: 'workout',
      ownerId: 'admin',
    });
  });
});
