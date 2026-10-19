import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { workoutsApi } from "@/features/workouts/workouts-api";
import { WorkoutDetail } from "@/features/workouts/components/workout-detail";
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const path = `/workouts/${id}`;
  const { user, accessToken } = await requireSession(path);
  const workout = await workoutsApi.get(id, accessToken);
  if (!workout.ok) {
    if (workout.error.status === 401) redirect(getLoginUrl(path));
    if (workout.error.status === 404) notFound();
    throw new Error(workout.error.message);
  }
  const groups = await exercisesApi.muscleGroups(accessToken);
  if (!groups.ok) {
    if (groups.error.status === 401) redirect(getLoginUrl(path));
    throw new Error(groups.error.message);
  }
  return (
    <WorkoutDetail
      key={id}
      workout={workout.data}
      groups={groups.data}
      isAdmin={user.role === "admin"}
    />
  );
}
