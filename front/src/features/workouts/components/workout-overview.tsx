import { CalendarDays, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrainingSummary } from "@/features/training/components/training-summary";
import type { Workout } from "../contracts";
import { formatDuration, formatWorkoutDate } from "../formatters";

export function WorkoutOverview({ workout }: { workout: Workout }) {
  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays
              aria-hidden="true"
              className="size-4 text-primary/70"
            />
            <time dateTime={workout.workoutDate}>
              {formatWorkoutDate(workout.workoutDate)}
            </time>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-4 text-primary/70" />
            <span>Durée : {formatDuration(workout.durationMinutes)}</span>
          </p>
        </CardContent>
      </Card>
      <TrainingSummary
        exercises={workout.exercises}
        volumeLabel="Volume · kg"
      />
    </div>
  );
}
