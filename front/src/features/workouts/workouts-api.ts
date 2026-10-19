import "server-only";
import { z } from "zod";
import { createApiClient } from "@/lib/http/api-client";
import {
  trainingExerciseSchema,
  type TrainingExerciseDraft,
} from "@/features/training/contracts";
import {
  workoutSchema,
  workoutSummarySchema,
  type WorkoutPayload,
} from "./contracts";
const request = createApiClient(() => process.env.WORKOUT_API_URL);
export const workoutsApi = {
  list(token: string) {
    return request("/workouts", z.array(workoutSummarySchema), { token });
  },
  get(id: string, token: string) {
    return request(`/workouts/${encodeURIComponent(id)}`, workoutSchema, {
      token,
    });
  },
  create(body: WorkoutPayload, token: string) {
    return request("/workouts", workoutSchema, {
      method: "POST",
      body,
      token,
      timeoutMs: 10000,
    });
  },
  update(id: string, body: WorkoutPayload, token: string) {
    return request(`/workouts/${encodeURIComponent(id)}`, workoutSchema, {
      method: "PUT",
      body,
      token,
      timeoutMs: 10000,
    });
  },
  addExercise(
    id: string,
    body: Omit<TrainingExerciseDraft, "title">,
    token: string,
  ) {
    return request(
      `/workouts/${encodeURIComponent(id)}/exercises`,
      trainingExerciseSchema,
      { method: "POST", body, token, timeoutMs: 10000 },
    );
  },
  removeExercise(id: string, inclusionId: string, token: string) {
    return request(
      `/workouts/${encodeURIComponent(id)}/exercises/${encodeURIComponent(inclusionId)}`,
      z.void(),
      { method: "DELETE", token, timeoutMs: 10000 },
    );
  },
  delete(id: string, token: string) {
    return request(`/workouts/${encodeURIComponent(id)}`, z.void(), {
      method: "DELETE",
      token,
      timeoutMs: 10000,
    });
  },
};
