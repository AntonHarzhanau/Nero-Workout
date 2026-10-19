import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { workoutsApi } from "@/features/workouts/workouts-api";
import { plansApi } from "@/features/plans/plans-api";
import { WorkoutsCatalog } from "@/features/workouts/components/workouts-catalog";
export default async function WorkoutsPage() {
  const { user, accessToken } = await requireSession("/workouts");
  const [workouts, groups, plans] = await Promise.all([
    workoutsApi.list(accessToken),
    exercisesApi.muscleGroups(accessToken),
    plansApi.list(accessToken),
  ]);
  if (!workouts.ok) {
    if (workouts.error.status === 401) redirect(getLoginUrl("/workouts"));
    throw new Error(workouts.error.message);
  }
  if (!groups.ok) {
    if (groups.error.status === 401) redirect(getLoginUrl("/workouts"));
    throw new Error(groups.error.message);
  }
  if (!plans.ok) {
    if (plans.error.status === 401) redirect(getLoginUrl("/workouts"));
    throw new Error(plans.error.message);
  }
  return (
    <WorkoutsCatalog
      workouts={workouts.data}
      plans={plans.data}
      groups={groups.data}
      isAdmin={user.role === "admin"}
    />
  );
}
