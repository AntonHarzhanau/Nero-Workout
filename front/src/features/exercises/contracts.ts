import { z } from "zod";
import { paginationMetaSchema } from "@/lib/http/pagination";

export const muscleGroupSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export const exerciseSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  equipment: z.string().nullable(),
  visibility: z.enum(["private", "public"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  muscleGroups: z.array(muscleGroupSchema),
});

export const exercisesPageSchema = z.object({
  data: z.array(exerciseSchema),
  meta: paginationMetaSchema,
});

export const exerciseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis.")
    .max(120, "120 caractères maximum."),

  description: z.string().max(2000, "2000 caractères maximum."),
  equipment: z.string().max(120, "120 caractères maximum."),
  visibility: z.enum(["private", "public"]),
  muscleGroups: z
    .array(z.uuid())
    .max(10, "Choisissez au maximum 10 groupes musculaires.")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Les groupes musculaires doivent être uniques.",
    ),
});

export type MuscleGroup = z.infer<typeof muscleGroupSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type ExercisesPage = z.infer<typeof exercisesPageSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export type ExercisePayload = {
  title: string;
  description: string | null;
  equipment: string | null;
  visibility: Exercise["visibility"];
  muscleGroups: string[];
};
