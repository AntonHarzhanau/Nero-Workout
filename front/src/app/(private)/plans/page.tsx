import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { plansApi } from "@/features/plans/plans-api";
import { PlansCatalog } from "@/features/plans/components/plans-catalog";
export default async function PlansPage() {
  const { user, accessToken } = await requireSession("/plans");
  const [plans, groups] = await Promise.all([
    plansApi.list(accessToken),
    exercisesApi.muscleGroups(accessToken),
  ]);
  if (!plans.ok) {
    if (plans.error.status === 401) redirect(getLoginUrl("/plans"));
    throw new Error(plans.error.message);
  }
  if (!groups.ok) {
    if (groups.error.status === 401) redirect(getLoginUrl("/plans"));
    throw new Error(groups.error.message);
  }
  return (
    <PlansCatalog
      plans={plans.data}
      groups={groups.data}
      isAdmin={user.role === "admin"}
    />
  );
}
