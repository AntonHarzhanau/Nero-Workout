import "server-only";

import { createApiClient } from "@/lib/http/api-client";
import {
  reportSchema,
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
  report(token: string, range: DateRange = {}) {
    return request(
      `/stats/report${query(withRange(new URLSearchParams(), range))}`,
      reportSchema,
      { token },
    );
  },
  strengthCurve(exerciseId: string, token: string, range: DateRange = {}) {
    const params = withRange(new URLSearchParams({ exerciseId }), range);

    return request(
      `/stats/strength-curve${query(params)}`,
      strengthCurveSchema,
      {
        token,
      },
    );
  },
};
