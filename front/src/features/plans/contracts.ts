import { z } from "zod";
import {
  trainingExerciseDraftSchema,
  trainingExerciseInputSchema,
  trainingExerciseSchema,
} from "@/features/training/contracts";
export const MAX_PLAN_EXERCISES = 200;
export const planSummarySchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const planSchema = planSummarySchema.extend({
  exercises: z.array(trainingExerciseSchema),
});
export const planPayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le nom du plan est requis.")
    .max(120, "120 caractères maximum."),
  description: z.string().max(10000, "10000 caractères maximum.").nullable(),
  exercises: z
    .array(trainingExerciseInputSchema)
    .max(MAX_PLAN_EXERCISES, "200 exercices maximum."),
});
export const planFormSchema = planPayloadSchema.extend({
  description: z.string().max(10000, "10000 caractères maximum."),
  exercises: z
    .array(trainingExerciseDraftSchema)
    .max(MAX_PLAN_EXERCISES, "200 exercices maximum."),
});
export type PlanSummary = z.infer<typeof planSummarySchema>;
export type Plan = z.infer<typeof planSchema>;
export type PlanPayload = z.infer<typeof planPayloadSchema>;
export type PlanFormValues = z.infer<typeof planFormSchema>;
