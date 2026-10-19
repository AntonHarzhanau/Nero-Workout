import type { ExerciseView } from '../exercises/exercise.types.js';
import type {
  CreateWorkoutDto,
  WorkoutExerciseInputDto,
} from './dto/create-workout.dto.js';
import type { WorkoutExercise } from './entities/workout-exercise.entity.js';
import type { Workout } from './entities/workout.entity.js';
import type {
  WorkoutExerciseValues,
  WorkoutExerciseView,
  WorkoutSummary,
  WorkoutValues,
  WorkoutView,
} from './workout.types.js';

export function toWorkoutExerciseValues(
  input: WorkoutExerciseInputDto,
  exercise: ExerciseView,
): WorkoutExerciseValues {
  return {
    exerciseId: input.exerciseId,
    exerciseNameSnapshot: exercise.title,
    muscleGroupsSnapshot: exercise.muscleGroups
      .map((group) => group.code)
      .sort(),
    sets: input.sets.map((set, index) => ({
      position: index + 1,
      weightKg: set.weightKg.toFixed(2),
      reps: set.reps,
    })),
  };
}

export function toWorkoutValues(
  dto: CreateWorkoutDto,
  exercises: ExerciseView[],
): WorkoutValues {
  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );

  return {
    title: dto.title.trim(),
    workoutDate: dto.workoutDate,
    durationMinutes: dto.durationMinutes ?? null,
    description: dto.description ?? null,
    exercises: dto.exercises.map((item, index) => {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise) {
        throw new Error(`Missing exercise data: ${item.exerciseId}`);
      }
      return {
        ...toWorkoutExerciseValues(item, exercise),
        position: index + 1,
      };
    }),
  };
}

export function toWorkoutSummary(workout: WorkoutSummary): WorkoutSummary {
  return {
    id: workout.id,
    ownerId: workout.ownerId,
    title: workout.title,
    workoutDate: workout.workoutDate,
    durationMinutes: workout.durationMinutes,
    description: workout.description,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
  };
}

export function toWorkoutExerciseView(
  item: WorkoutExercise,
  exercise: ExerciseView,
): WorkoutExerciseView {
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

export function toWorkoutView(
  workout: Workout,
  exercises: ExerciseView[],
): WorkoutView {
  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );

  return {
    ...toWorkoutSummary(workout),
    exercises: workout.exercises.map((item) => {
      const exercise = exerciseById.get(item.exerciseId);

      if (!exercise) {
        throw new Error(`Missing exercise data: ${item.exerciseId}`);
      }

      return toWorkoutExerciseView(item, exercise);
    }),
  };
}
