import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { plansApi } from "@/features/plans/plans-api";
import { PlanDetail } from "@/features/plans/components/plan-detail";
export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const path = `/plans/${id}`;
  const { user, accessToken } = await requireSession(path);
  const plan = await plansApi.get(id, accessToken);
  if (!plan.ok) {
    if (plan.error.status === 401) redirect(getLoginUrl(path));
    if (plan.error.status === 404) notFound();
    throw new Error(plan.error.message);
  }
  const groups = await exercisesApi.muscleGroups(accessToken);
  if (!groups.ok) throw new Error(groups.error.message);
  return (
    <PlanDetail
      key={id}
      plan={plan.data}
      groups={groups.data}
      isAdmin={user.role === "admin"}
    />
  );
}
