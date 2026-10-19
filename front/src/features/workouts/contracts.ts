import { z } from "zod";
import {
  trainingExerciseDraftSchema,
  trainingExerciseInputSchema,
  trainingExerciseSchema,
  trainingSetInputSchema,
} from "@/features/training/contracts";

export const MAX_WORKOUT_EXERCISES = 100;
export const MAX_WORKOUT_SETS = 100;
const setsSchema = z
  .array(trainingSetInputSchema)
  .max(MAX_WORKOUT_SETS, "100 séries maximum par exercice.");
export const workoutExerciseInputSchema = trainingExerciseInputSchema.extend({
  sets: setsSchema,
});
const workoutExerciseDraftSchema = trainingExerciseDraftSchema.extend({
  sets: setsSchema,
});
const dateSchema = z.iso.date({ error: "Indiquez une date valide." });
const durationSchema = z
  .number({ error: "Indiquez une durée valide." })
  .int("Un nombre entier de minutes est requis.")
  .min(0, "La durée doit être positive ou nulle.")
  .max(5000, "5000 minutes maximum.")
  .nullable();

export const workoutSummarySchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  workoutDate: dateSchema,
  durationMinutes: durationSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const workoutSchema = workoutSummarySchema.extend({
  exercises: z.array(trainingExerciseSchema),
});
export const workoutPayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le nom de la séance est requis.")
    .max(120, "120 caractères maximum."),
  workoutDate: dateSchema,
  durationMinutes: durationSchema,
  description: z.string().max(10000, "10000 caractères maximum.").nullable(),
  exercises: z
    .array(workoutExerciseInputSchema)
    .max(MAX_WORKOUT_EXERCISES, "100 exercices maximum."),
});
export const workoutFormSchema = workoutPayloadSchema.extend({
  description: z.string().max(10000, "10000 caractères maximum."),
  exercises: z
    .array(workoutExerciseDraftSchema)
    .max(MAX_WORKOUT_EXERCISES, "100 exercices maximum."),
});
export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutPayload = z.infer<typeof workoutPayloadSchema>;
export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;
