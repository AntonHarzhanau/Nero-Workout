import "server-only";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import type { Exercise } from "@/features/exercises/contracts";
import { workoutsApi } from "@/features/workouts/workouts-api";
import type { ApiResult } from "@/lib/http/api-client";
import { statisticsApi } from "./statistics-api";
import {
  periodRange,
  statisticsPeriods,
  type StatisticsPageData,
  type StatisticsPeriod,
} from "./view-model";

export async function loadStatistics(
  path: "/dashboard" | "/progress",
  query: Record<string, string | string[] | undefined>,
): Promise<StatisticsPageData> {
  const period: StatisticsPeriod = statisticsPeriods.some(
    (p) => p.id === query.period,
  )
    ? (query.period as StatisticsPeriod)
    : path === "/dashboard"
      ? "month"
      : "12w";
  const returnTo = `${path}?period=${period}`;
  const { user, accessToken } = await requireSession(returnTo);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  function unwrap<T>(result: ApiResult<T>): T {
    if (result.ok) return result.data;
    if (result.error.status === 401) redirect(getLoginUrl(returnTo));
    throw new Error(result.error.message);
  }
  async function ownExercises() {
    const exercises: Exercise[] = [];
    for (let page = 1; ; page++) {
      const result = unwrap(
        await exercisesApi.list(
          { scope: "mine", page, search: "" },
          accessToken,
        ),
      );
      exercises.push(...result.data);
      if (!result.meta.hasNextPage) return exercises;
    }
  }
  const [report, workouts, groups, owned] = await Promise.all([
    statisticsApi.report(accessToken, periodRange(period, today)).then(unwrap),
    workoutsApi.list(accessToken).then(unwrap),
    exercisesApi.muscleGroups(accessToken).then(unwrap),
    ownExercises(),
  ]);
  const exercises = new Map(
    report.exerciseOptions.map((e) => [
      e.exerciseId,
      { id: e.exerciseId, name: e.exerciseName },
    ]),
  );
  for (const exercise of owned)
    exercises.set(exercise.id, { id: exercise.id, name: exercise.title });
  return {
    userId: user.id,
    userName: user.name,
    today,
    period,
    report,
    workouts,
    groups,
    exercises: [...exercises.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    ),
  };
}
