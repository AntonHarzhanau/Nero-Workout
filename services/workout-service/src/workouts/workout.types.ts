import type { ExerciseView } from '../exercises/exercise.types.js';

interface WorkoutSetValues {
  position: number;
  weightKg: string;
  reps: number;
}

export interface WorkoutExerciseValues {
  exerciseId: string;
  exerciseNameSnapshot: string;
  muscleGroupsSnapshot: string[];
  sets: WorkoutSetValues[];
}

interface PositionedWorkoutExerciseValues extends WorkoutExerciseValues {
  position: number;
}

export interface WorkoutValues {
  workoutDate: string;
  durationMinutes: number | null;
  title: string;
  description: string | null;
  exercises: PositionedWorkoutExerciseValues[];
}

export interface WorkoutSummary {
  workoutDate: string;
  durationMinutes: number | null;
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkoutSetView extends WorkoutSetValues {
  id: string;
}

export interface WorkoutExerciseView {
  id: string;
  exerciseId: string;
  position: number;
  exercise: ExerciseView;
  sets: WorkoutSetView[];
}

export interface WorkoutView extends WorkoutSummary {
  exercises: WorkoutExerciseView[];
}

export interface WorkoutStatisticsRange {
  from?: string;
  to?: string;
}

export interface WorkoutStatisticsView {
  id: string;
  workoutDate: string;
  durationMinutes: number | null;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroups: string[];
    sets: { weightKg: string; reps: number }[];
  }[];
}
