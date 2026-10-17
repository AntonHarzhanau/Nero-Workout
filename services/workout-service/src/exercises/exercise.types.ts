import type { ExerciseVisibility } from './entities/exercise.entity.js';

export interface ExerciseValues {
  title: string;
  description: string | null;
  equipment: string | null;
  visibility: ExerciseVisibility;
  muscleGroupIds: string[];
}

export interface SaveExerciseInput extends ExerciseValues {
  id?: string;
  ownerId: string;
}

export interface MuscleGroupView {
  id: string;
  code: string;
  name: string;
}

export interface ExerciseView {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  equipment: string | null;
  visibility: ExerciseVisibility;
  createdAt: Date;
  updatedAt: Date;
  muscleGroups: MuscleGroupView[];
}
