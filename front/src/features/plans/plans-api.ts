import "server-only";
import { z } from "zod";
import { createApiClient } from "@/lib/http/api-client";
import {
  trainingExerciseSchema,
  type trainingExerciseInputSchema,
} from "@/features/training/contracts";
import { planSchema, planSummarySchema, type PlanPayload } from "./contracts";
const request = createApiClient(() => process.env.WORKOUT_API_URL);
export const plansApi = {
  list(token: string) {
    return request("/plans", z.array(planSummarySchema), { token });
  },
  get(id: string, token: string) {
    return request(`/plans/${encodeURIComponent(id)}`, planSchema, { token });
  },
  create(body: PlanPayload, token: string) {
    return request("/plans", planSchema, {
      method: "POST",
      body,
      token,
      timeoutMs: 10000,
    });
  },
  update(id: string, body: PlanPayload, token: string) {
    return request(`/plans/${encodeURIComponent(id)}`, planSchema, {
      method: "PUT",
      body,
      token,
      timeoutMs: 10000,
    });
  },
  addExercise(
    id: string,
    body: z.infer<typeof trainingExerciseInputSchema>,
    token: string,
  ) {
    return request(
      `/plans/${encodeURIComponent(id)}/exercises`,
      trainingExerciseSchema,
      { method: "POST", body, token, timeoutMs: 10000 },
    );
  },
  removeExercise(id: string, inclusionId: string, token: string) {
    return request(
      `/plans/${encodeURIComponent(id)}/exercises/${encodeURIComponent(inclusionId)}`,
      z.void(),
      { method: "DELETE", token, timeoutMs: 10000 },
    );
  },
  delete(id: string, token: string) {
    return request(`/plans/${encodeURIComponent(id)}`, z.void(), {
      method: "DELETE",
      token,
      timeoutMs: 10000,
    });
  },
};
