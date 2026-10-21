import type { ExerciseView } from '../exercises/exercise.types.js';

interface PlanSetValues {
  position: number;
  weightKg: string;
  reps: number;
}

export interface PlanExerciseValues {
  exerciseId: string;
  sets: PlanSetValues[];
}

interface PositionedPlanExerciseValues extends PlanExerciseValues {
  position: number;
}

export interface PlanValues {
  title: string;
  description: string | null;
  exercises: PositionedPlanExerciseValues[];
}

export interface PlanSummary {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PlanSetView extends PlanSetValues {
  id: string;
}

export interface PlanExerciseView {
  id: string;
  exerciseId: string;
  position: number;
  exercise: ExerciseView;
  sets: PlanSetView[];
}

export interface PlanView extends PlanSummary {
  exercises: PlanExerciseView[];
}
