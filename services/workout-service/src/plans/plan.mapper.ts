import type { ExerciseView } from '../exercises/exercise.types.js';
import type {
  CreatePlanDto,
  PlanExerciseInputDto,
} from './dto/create-plan.dto.js';
import type { PlanExercise } from './entities/plan-exercise.entity.js';
import type { Plan } from './entities/plan.entity.js';
import type {
  PlanExerciseValues,
  PlanExerciseView,
  PlanSummary,
  PlanValues,
  PlanView,
} from './plan.types.js';

export function toPlanExerciseValues(
  input: PlanExerciseInputDto,
): PlanExerciseValues {
  return {
    exerciseId: input.exerciseId,
    sets: input.sets.map((set, index) => ({
      position: index + 1,
      weightKg: set.weightKg.toFixed(2),
      reps: set.reps,
    })),
  };
}

export function toPlanValues(dto: CreatePlanDto): PlanValues {
  return {
    title: dto.title.trim(),
    description: dto.description ?? null,
    exercises: dto.exercises.map((item, index) => ({
      ...toPlanExerciseValues(item),
      position: index + 1,
    })),
  };
}

export function toPlanSummary(plan: PlanSummary): PlanSummary {
  return {
    id: plan.id,
    ownerId: plan.ownerId,
    title: plan.title,
    description: plan.description,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function toPlanExerciseView(
  item: PlanExercise,
  exercise: ExerciseView,
): PlanExerciseView {
  return {
    id: item.id,
    exerciseId: item.exerciseId,
    position: item.position,
    exercise,
    sets: item.sets.map((set) => ({
      id: set.id,
      position: set.position,
      weightKg: set.weightKg,
      reps: set.reps,
    })),
  };
}

export function toPlanView(plan: Plan, exercises: ExerciseView[]): PlanView {
  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );

  return {
    ...toPlanSummary(plan),
    exercises: plan.planExercises.map((item) => {
      const exercise = exerciseById.get(item.exerciseId);

      if (!exercise) {
        throw new Error(`Missing exercise data: ${item.exerciseId}`);
      }

      return toPlanExerciseView(item, exercise);
    }),
  };
}
