import { z } from "zod";

const dateSchema = z.iso.date();
const percentChangeSchema = z.number().nullable();

export const overviewSchema = z.object({
  month: z.object({
    month: z.string(),
    workouts: z.number().int(),
    activeDays: z.number().int(),
    durationMinutes: z.number().int(),
    volumeKg: z.number(),
    sets: z.number().int(),
    reps: z.number().int(),
    vsPreviousMonth: z.object({
      workouts: percentChangeSchema,
      volumeKg: percentChangeSchema,
    }),
  }),
  currentWeek: z.array(
    z.object({
      date: dateSchema,
      trained: z.boolean(),
      volumeKg: z.number(),
    }),
  ),
});

export const strengthCurveSchema = z.object({
  exerciseId: z.uuid(),
  exerciseName: z.string().nullable(),
  points: z.array(
    z.object({
      date: dateSchema,
      maxWeightKg: z.number(),
      estimated1RmKg: z.number(),
    }),
  ),
});

export const progressionSchema = z.object({
  summary: z.object({
    workouts: z.number().int(),
    durationMinutes: z.number().int(),
    volumeKg: z.number(),
    sets: z.number().int(),
    reps: z.number().int(),
    averageDurationMinutes: z.number().nullable(),
    averageWorkoutsPerWeek: z.number(),
    firstWorkoutDate: dateSchema.nullable(),
  }),
  exercises: z.array(
    z.object({
      exerciseId: z.uuid(),
      exerciseName: z.string(),
      sets: z.number().int(),
      volumeKg: z.number(),
      maxWeightKg: z.number().nullable(),
      maxWeightDate: dateSchema.nullable(),
      bestEstimated1RmKg: z.number().nullable(),
    }),
  ),
  // An exercise counts for every muscle group it targets: volumes do not add up to the total
  muscleGroups: z.array(
    z.object({
      muscleGroup: z.string(),
      sets: z.number().int(),
      volumeKg: z.number(),
    }),
  ),
  records: z.array(
    z.object({
      date: dateSchema,
      exerciseId: z.uuid(),
      exerciseName: z.string(),
      weightKg: z.number(),
      previousWeightKg: z.number(),
    }),
  ),
});

export type Overview = z.infer<typeof overviewSchema>;
export type StrengthCurve = z.infer<typeof strengthCurveSchema>;
export type Progression = z.infer<typeof progressionSchema>;

export type DateRange = {
  from?: string;
  to?: string;
};
