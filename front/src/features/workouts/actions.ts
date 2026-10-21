"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import type { ActionError, ApiError, ApiResult } from "@/lib/http/api-client";
import { mutationError, sessionError } from "@/lib/http/mutation-error";
import { type TrainingExercise } from "@/features/training/contracts";
import {
  workoutExerciseInputSchema,
  workoutPayloadSchema,
  type Workout,
} from "./contracts";
import { workoutsApi } from "./workouts-api";
const notFoundMessage = "Cette séance n’existe plus ou n’est plus accessible.";
function invalidId(): ApiError {
  return { message: "Identifiant de la séance ou de l’exercice invalide." };
}
function revalidateWorkout(id?: string) {
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  if (id) revalidatePath(`/workouts/${id}`);
}

export async function saveWorkoutAction(
  workoutId: unknown,
  input: unknown,
): Promise<ApiResult<Workout>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const id = z.uuid().nullable().safeParse(workoutId);
  if (!id.success) return { ok: false, error: invalidId() };
  const parsed = workoutPayloadSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: {
        message:
          "Vérifiez le nom, la date, la durée et les séries de la séance.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
    };
  const payload = {
    ...parsed.data,
    description: parsed.data.description?.trim() || null,
  };
  const result =
    id.data === null
      ? await workoutsApi.create(payload, accessToken)
      : await workoutsApi.update(id.data, payload, accessToken);
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidateWorkout(id.data ?? undefined);
  return result;
}

export async function addWorkoutExerciseAction(
  workoutId: unknown,
  input: unknown,
): Promise<ApiResult<TrainingExercise>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const id = z.uuid().safeParse(workoutId);
  const parsed = workoutExerciseInputSchema.safeParse(input);
  if (!id.success || !parsed.success)
    return {
      ok: false,
      error: { message: "Vérifiez l’exercice et ses séries." },
    };
  const result = await workoutsApi.addExercise(
    id.data,
    parsed.data,
    accessToken,
  );
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidateWorkout(id.data);
  return result;
}

export async function removeWorkoutExerciseAction(
  workoutId: unknown,
  inclusionId: unknown,
): Promise<ApiResult<void>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const ids = z
    .object({ workoutId: z.uuid(), inclusionId: z.uuid() })
    .safeParse({ workoutId, inclusionId });
  if (!ids.success) return { ok: false, error: invalidId() };
  const result = await workoutsApi.removeExercise(
    ids.data.workoutId,
    ids.data.inclusionId,
    accessToken,
  );
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidateWorkout(ids.data.workoutId);
  return result;
}

export async function deleteWorkoutAction(
  workoutId: unknown,
): Promise<ActionError> {
  const { accessToken } = await readSession();
  if (!accessToken) return sessionError;
  const id = z.uuid().safeParse(workoutId);
  if (!id.success) return invalidId();
  const result = await workoutsApi.delete(id.data, accessToken);
  if (!result.ok) return mutationError(result.error, notFoundMessage);
  revalidateWorkout();
  redirect("/workouts");
}
