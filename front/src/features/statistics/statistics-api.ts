import "server-only";

import { createApiClient } from "@/lib/http/api-client";
import {
  overviewSchema,
  progressionSchema,
  strengthCurveSchema,
  type DateRange,
} from "./contracts";

const request = createApiClient(() => process.env.STATISTICS_API_URL);

function withRange(params: URLSearchParams, range: DateRange) {
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  return params;
}

function query(params: URLSearchParams) {
  const value = params.toString();
  return value ? `?${value}` : "";
}

export const statisticsApi = {
  /** Month totals (current month by default, "YYYY-MM") and the current week. */
  overview(token: string, month?: string) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);

    return request(`/stats/overview${query(params)}`, overviewSchema, {
      token,
    });
  },

  strengthCurve(exerciseId: string, token: string, range: DateRange = {}) {
    const params = withRange(new URLSearchParams({ exerciseId }), range);

    return request(`/stats/strength-curve${query(params)}`, strengthCurveSchema, {
      token,
    });
  },

  /** Whole history by default. */
  progression(token: string, range: DateRange = {}) {
    const params = withRange(new URLSearchParams(), range);

    return request(`/stats/progression${query(params)}`, progressionSchema, {
      token,
    });
  },
};
