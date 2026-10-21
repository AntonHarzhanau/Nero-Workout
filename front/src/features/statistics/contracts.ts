import { z } from "zod";

const dateSchema = z.iso.date();

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

const summarySchema = z.object({
  workouts: z.number().int(),
  durationMinutes: z.number().int(),
  volumeKg: z.number(),
  sets: z.number().int(),
  reps: z.number().int(),
  averageDurationMinutes: z.number().nullable(),
  averageWorkoutsPerWeek: z.number(),
  firstWorkoutDate: dateSchema.nullable(),
});

const progressionSchema = z.object({
  summary: summarySchema,
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

export type StrengthCurve = z.infer<typeof strengthCurveSchema>;

export type DateRange = {
  from?: string;
  to?: string;
};

const activityPointSchema = z.object({
  date: dateSchema,
  workouts: z.number().int(),
  sets: z.number().int(),
  reps: z.number().int(),
  volumeKg: z.number(),
  durationMinutes: z.number().int(),
});
export const reportSchema = progressionSchema.extend({
  from: dateSchema,
  to: dateSchema,
  previousSummary: summarySchema.nullable(),
  days: z.array(activityPointSchema),
  weeks: z.array(activityPointSchema),
  exerciseOptions: z.array(
    z.object({ exerciseId: z.uuid(), exerciseName: z.string() }),
  ),
});
export type Report = z.infer<typeof reportSchema>;
