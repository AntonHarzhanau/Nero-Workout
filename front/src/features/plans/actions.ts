"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import type { ActionError, ApiError, ApiResult } from "@/lib/http/api-client";
import { mutationError, sessionError } from "@/lib/http/mutation-error";
import {
  trainingExerciseInputSchema,
  type TrainingExercise,
} from "@/features/training/contracts";
import { planPayloadSchema, type Plan } from "./contracts";
import { plansApi } from "./plans-api";
const notFoundMessage = "Ce plan n’existe plus ou n’est plus accessible.";
function invalidId(): ApiError {
  return { message: "Identifiant du plan ou de l’exercice invalide." };
}
function revalidatePlan(id?: string) {
  revalidatePath("/plans");
  if (id) revalidatePath(`/plans/${id}`);
}

export async function savePlanAction(
  planId: unknown,
  input: unknown,
): Promise<ApiResult<Plan>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const id = z.uuid().nullable().safeParse(planId);
  if (!id.success) return { ok: false, error: invalidId() };
  const parsed = planPayloadSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: {
        message: "Vérifiez le nom, les exercices et les séries du plan.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
    };
  const payload = {
    ...parsed.data,
    description: parsed.data.description?.trim() || null,
  };
  const result =
    id.data === null
      ? await plansApi.create(payload, accessToken)
      : await plansApi.update(id.data, payload, accessToken);
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidatePlan(id.data ?? undefined);
  return result;
}

export async function addPlanExerciseAction(
  planId: unknown,
  input: unknown,
): Promise<ApiResult<TrainingExercise>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const id = z.uuid().safeParse(planId);
  const parsed = trainingExerciseInputSchema.safeParse(input);
  if (!id.success || !parsed.success)
    return {
      ok: false,
      error: { message: "Vérifiez l’exercice et ses séries." },
    };
  const result = await plansApi.addExercise(id.data, parsed.data, accessToken);
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidatePlan(id.data);
  return result;
}

export async function removePlanExerciseAction(
  planId: unknown,
  inclusionId: unknown,
): Promise<ApiResult<void>> {
  const { accessToken } = await readSession();
  if (!accessToken) return { ok: false, error: sessionError };
  const ids = z
    .object({ planId: z.uuid(), inclusionId: z.uuid() })
    .safeParse({ planId, inclusionId });
  if (!ids.success) return { ok: false, error: invalidId() };
  const result = await plansApi.removeExercise(
    ids.data.planId,
    ids.data.inclusionId,
    accessToken,
  );
  if (!result.ok)
    return { ok: false, error: mutationError(result.error, notFoundMessage) };
  revalidatePlan(ids.data.planId);
  return result;
}

export async function deletePlanAction(planId: unknown): Promise<ActionError> {
  const { accessToken } = await readSession();
  if (!accessToken) return sessionError;
  const id = z.uuid().safeParse(planId);
  if (!id.success) return invalidId();
  const result = await plansApi.delete(id.data, accessToken);
  if (!result.ok) return mutationError(result.error, notFoundMessage);
  revalidatePlan();
  redirect("/plans");
}
