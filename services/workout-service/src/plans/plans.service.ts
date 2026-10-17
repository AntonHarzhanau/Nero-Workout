import { Injectable, NotFoundException } from '@nestjs/common';

import { ExercisesService } from '../exercises/exercises.service.js';
import { AddPlanExerciseDto } from './dto/add-plan-exercise.dto.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import {
  toPlanExerciseValues,
  toPlanExerciseView,
  toPlanSummary,
  toPlanValues,
  toPlanView,
} from './plan.mapper.js';
import type { PlanExerciseView, PlanSummary, PlanView } from './plan.types.js';
import { PlansRepository } from './plans.repository.js';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly exercisesService: ExercisesService,
  ) {}

  async findMine(userId: string): Promise<PlanSummary[]> {
    const plans = await this.plansRepository.findMine(userId);

    return plans.map(toPlanSummary);
  }

  async findOne(userId: string, planId: string): Promise<PlanView> {
    const plan = await this.plansRepository.findOwnedById(userId, planId);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const exercises = await this.exercisesService.getAvailableByIds(
      userId,
      plan.planExercises.map((item) => item.exerciseId),
    );

    return toPlanView(plan, exercises);
  }

  async create(userId: string, dto: CreatePlanDto): Promise<PlanView> {
    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    const saved = await this.plansRepository.create(userId, toPlanValues(dto));

    return this.findOne(userId, saved.id);
  }

  async update(
    userId: string,
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<PlanView> {
    await this.ensureOwned(userId, planId);

    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    await this.plansRepository.replaceOwned(userId, planId, toPlanValues(dto));

    return this.findOne(userId, planId);
  }

  async addExercise(
    userId: string,
    planId: string,
    dto: AddPlanExerciseDto,
  ): Promise<PlanExerciseView> {
    await this.ensureOwned(userId, planId);

    const exercise = await this.exercisesService.findOne(
      userId,
      dto.exerciseId,
    );
    const saved = await this.plansRepository.appendExercise(
      userId,
      planId,
      toPlanExerciseValues(dto),
    );

    return toPlanExerciseView(saved, exercise);
  }

  removeExercise(
    userId: string,
    planId: string,
    planExerciseId: string,
  ): Promise<void> {
    return this.plansRepository.removeExercise(userId, planId, planExerciseId);
  }

  async delete(userId: string, planId: string): Promise<void> {
    const deleted = await this.plansRepository.deleteOwned(userId, planId);

    if (!deleted) {
      throw new NotFoundException('Plan not found');
    }
  }

  private async ensureOwned(userId: string, planId: string): Promise<void> {
    const exists = await this.plansRepository.existsOwned(userId, planId);

    if (!exists) {
      throw new NotFoundException('Plan not found');
    }
  }
}
