import { Injectable, NotFoundException } from '@nestjs/common';

import { ExercisesService } from '../exercises/exercises.service.js';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import {
  toWorkoutExerciseValues,
  toWorkoutExerciseView,
  toWorkoutSummary,
  toWorkoutValues,
  toWorkoutView,
} from './workout.mapper.js';
import type {
  WorkoutExerciseView,
  WorkoutSummary,
  WorkoutView,
} from './workout.types.js';
import { WorkoutsRepository } from './workouts.repository.js';
import type { EntityManager } from 'typeorm';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly workoutsRepository: WorkoutsRepository,
    private readonly exercisesService: ExercisesService,
  ) {}

  async findMine(userId: string): Promise<WorkoutSummary[]> {
    const workouts = await this.workoutsRepository.findMine(userId);

    return workouts.map(toWorkoutSummary);
  }

  async findOne(userId: string, workoutId: string): Promise<WorkoutView> {
    const workout = await this.workoutsRepository.findOwnedById(
      userId,
      workoutId,
    );

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const exercises = await this.exercisesService.getAvailableByIds(
      userId,
      workout.exercises.map((item) => item.exerciseId),
    );

    return toWorkoutView(workout, exercises);
  }

  async create(userId: string, dto: CreateWorkoutDto): Promise<WorkoutView> {
    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    const saved = await this.workoutsRepository.create(
      userId,
      toWorkoutValues(dto),
    );

    return this.findOne(userId, saved.id);
  }

  async update(
    userId: string,
    workoutId: string,
    dto: UpdateWorkoutDto,
  ): Promise<WorkoutView> {
    await this.ensureOwned(userId, workoutId);

    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    await this.workoutsRepository.replaceOwned(
      userId,
      workoutId,
      toWorkoutValues(dto),
    );

    return this.findOne(userId, workoutId);
  }

  async addExercise(
    userId: string,
    workoutId: string,
    dto: AddWorkoutExerciseDto,
  ): Promise<WorkoutExerciseView> {
    await this.ensureOwned(userId, workoutId);

    const exercise = await this.exercisesService.findOne(
      userId,
      dto.exerciseId,
    );
    const saved = await this.workoutsRepository.appendExercise(
      userId,
      workoutId,
      toWorkoutExerciseValues(dto),
    );

    return toWorkoutExerciseView(saved, exercise);
  }

  removeExercise(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<void> {
    return this.workoutsRepository.removeExercise(
      userId,
      workoutId,
      workoutExerciseId,
    );
  }

  async delete(userId: string, workoutId: string): Promise<void> {
    const deleted = await this.workoutsRepository.deleteOwned(
      userId,
      workoutId,
    );

    if (!deleted) {
      throw new NotFoundException('Workout not found');
    }
  }

  async deleteAllForUser(
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.workoutsRepository.deleteAllForUser(userId, manager);
  }

  private async ensureOwned(userId: string, workoutId: string): Promise<void> {
    const exists = await this.workoutsRepository.existsOwned(userId, workoutId);

    if (!exists) {
      throw new NotFoundException('Workout not found');
    }
  }
}
