"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { Workout } from "../contracts";
import { useWorkoutForm } from "../hooks/use-workout-form";
import { WorkoutForm } from "./workout-form";
export function WorkoutEditForm({
  workout,
  groups,
  isAdmin,
  onSaved,
  onCancel,
}: {
  workout: Workout;
  groups: MuscleGroup[];
  isAdmin: boolean;
  onSaved: (workout: Workout) => void;
  onCancel: () => void;
}) {
  const form = useWorkoutForm({ workout, onSaved });
  return (
    <Card>
      <CardContent>
        <WorkoutForm
          form={form}
          groups={groups}
          isAdmin={isAdmin}
          editing
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
}
