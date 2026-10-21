import type { MuscleGroup } from "@/features/exercises/contracts";
import type { WorkoutSummary } from "@/features/workouts/contracts";
import type { Report } from "./contracts";

export type StatisticsPeriod = "month" | "4w" | "12w" | "all";
export type StrengthMetric = "maxWeightKg" | "estimated1RmKg";
export const statisticsPeriods: { id: StatisticsPeriod; label: string }[] = [
  { id: "month", label: "Ce mois-ci" },
  { id: "4w", label: "4 semaines" },
  { id: "12w", label: "12 semaines" },
  { id: "all", label: "Tout l’historique" },
];
export type StatisticsPageData = {
  userId: string;
  userName: string;
  today: string;
  period: StatisticsPeriod;
  report: Report;
  workouts: WorkoutSummary[];
  exercises: { id: string; name: string }[];
  groups: MuscleGroup[];
};
export function addDays(day: string, count: number) {
  const value = new Date(`${day}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
export function mondayOf(day: string) {
  return addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function periodRange(period: StatisticsPeriod, today: string) {
  return {
    from:
      period === "all"
        ? undefined
        : period === "month"
          ? `${today.slice(0, 7)}-01`
          : addDays(today, period === "4w" ? -27 : -83),
    to: today,
  };
}
export function dateLabel(
  day: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) {
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}
export function numberLabel(value: number, digits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function initialExercise(data: StatisticsPageData) {
  return [...data.report.exercises]
    .filter((exercise) => exercise.maxWeightKg !== null)
    .sort((a, b) =>
      (b.maxWeightDate ?? "").localeCompare(a.maxWeightDate ?? ""),
    )[0]?.exerciseId;
}
