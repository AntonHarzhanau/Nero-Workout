import { z } from "zod";
import { exerciseSchema } from "@/features/exercises/contracts";

export const MAX_SETS = 200;
export const trainingSetInputSchema = z.object({
  weightKg: z
    .number({ error: "Indiquez un poids valide." })
    .min(0, "Le poids doit être positif ou nul.")
    .max(9999.99, "9999,99 kg maximum.")
    .multipleOf(0.01, "Deux décimales maximum."),
  reps: z
    .number({ error: "Indiquez les répétitions." })
    .int("Un nombre entier est requis.")
    .min(1, "Au moins une répétition.")
    .max(32767, "32767 répétitions maximum."),
});
export const trainingExerciseInputSchema = z.object({
  exerciseId: z.uuid(),
  sets: z.array(trainingSetInputSchema).max(MAX_SETS),
});
export const trainingExerciseSchema = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
  position: z.number().int().positive(),
  exercise: exerciseSchema,
  sets: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int().positive(),
      weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/),
      reps: z.number().int().positive(),
    }),
  ),
});
export const trainingExerciseDraftSchema = trainingExerciseInputSchema.extend({
  title: z.string().max(120),
});
export type TrainingExercise = z.infer<typeof trainingExerciseSchema>;
export type TrainingExerciseDraft = z.infer<typeof trainingExerciseDraftSchema>;
export type TrainingFormValues = { exercises: TrainingExerciseDraft[] };
export function defaultTrainingSets() {
  return Array.from({ length: 3 }, () => ({ weightKg: 0, reps: 10 }));
}
