import "server-only";

import { z } from "zod";
import { createApiClient } from "@/lib/http/api-client";
import {
  exerciseSchema,
  exercisesPageSchema,
  muscleGroupSchema,
  type ExercisePayload,
} from "./contracts";
import type { ExercisesQuery } from "./query";

const request = createApiClient(() => process.env.WORKOUT_API_URL);

export const exercisesApi = {
  list(query: ExercisesQuery, accessToken: string) {
    const params = new URLSearchParams({
      scope: query.scope,
      page: String(query.page),
      limit: "12",
    });

    if (query.search) {
      params.set("search", query.search);
    }

    if (query.muscleGroupId) {
      params.set("muscleGroupId", query.muscleGroupId);
    }

    return request(`/exercises?${params}`, exercisesPageSchema, {
      token: accessToken,
    });
  },

  get(id: string, accessToken: string) {
    return request(`/exercises/${encodeURIComponent(id)}`, exerciseSchema, {
      token: accessToken,
    });
  },

  muscleGroups(accessToken: string) {
    return request("/muscle-groups", z.array(muscleGroupSchema), {
      token: accessToken,
    });
  },

  create(payload: ExercisePayload, accessToken: string) {
    return request("/exercises", exerciseSchema, {
      method: "POST",
      body: payload,
      token: accessToken,
      timeoutMs: 10_000,
    });
  },

  update(id: string, payload: ExercisePayload, accessToken: string) {
    return request(`/exercises/${encodeURIComponent(id)}`, exerciseSchema, {
      method: "PUT",
      body: payload,
      token: accessToken,
      timeoutMs: 10_000,
    });
  },

  delete(id: string, accessToken: string) {
    return request(`/exercises/${encodeURIComponent(id)}`, z.void(), {
      method: "DELETE",
      token: accessToken,
      timeoutMs: 10_000,
    });
  },
};
