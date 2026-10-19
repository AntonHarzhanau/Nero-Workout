import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { WorkoutSummary } from "../contracts";
import {
  formatDuration,
  formatShortMonth,
  formatWorkoutDate,
} from "../formatters";

export function WorkoutRow({ workout }: { workout: WorkoutSummary }) {
  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="group flex min-w-0 items-center gap-3 border-t px-4 py-4 transition-colors outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-5 sm:px-6 sm:py-5"
    >
      <time
        dateTime={workout.workoutDate}
        aria-label={formatWorkoutDate(workout.workoutDate)}
        className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-md border bg-background/40"
      >
        <strong className="text-lg leading-none font-normal">
          {Number(workout.workoutDate.slice(8))}
        </strong>
        <span className="mt-1 text-[9px] text-muted-foreground uppercase">
          {formatShortMonth(workout.workoutDate)}
        </span>
      </time>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {workout.title}
        </span>
        <span className="mt-1.5 block text-[11px] text-muted-foreground">
          {formatWorkoutDate(workout.workoutDate)}
        </span>
      </span>
      <span className="max-w-24 shrink-0 text-right text-xs">
        {formatDuration(workout.durationMinutes)}
        <span className="mt-1.5 block text-[10px] text-muted-foreground">
          Durée
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
