import type { TrainingExercise, TrainingExerciseDraft } from "./contracts";

export function toTrainingDraft(
  exercises: TrainingExercise[],
): TrainingExerciseDraft[] {
  return exercises.map((item) => ({
    exerciseId: item.exerciseId,
    title: item.exercise.title,
    sets: item.sets.map((set) => ({
      weightKg: Number(set.weightKg),
      reps: set.reps,
    })),
  }));
}

export function toTrainingPayload(exercises: TrainingExerciseDraft[]) {
  return exercises.map(({ exerciseId, sets }) => ({ exerciseId, sets }));
}
