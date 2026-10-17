import type { CreateExerciseDto } from './dto/create-exercise.dto.js';
import type {
  Exercise,
  ExerciseVisibility,
} from './entities/exercise.entity.js';
import type { ExerciseValues, ExerciseView } from './exercise.types.js';

export function toExerciseValues(
  dto: CreateExerciseDto,
  visibility: ExerciseVisibility,
): ExerciseValues {
  return {
    title: dto.title.trim(),
    description: dto.description ?? null,
    equipment: dto.equipment ?? null,
    visibility,
    muscleGroupIds: [...dto.muscleGroups],
  };
}

export function toExerciseView(exercise: Exercise): ExerciseView {
  return {
    id: exercise.id,
    ownerId: exercise.ownerId,
    title: exercise.title,
    description: exercise.description,
    equipment: exercise.equipment,
    visibility: exercise.visibility,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,

    muscleGroups: exercise.muscleGroups.map((group) => ({
      id: group.id,
      code: group.code,
      name: group.name,
    })),
  };
}
