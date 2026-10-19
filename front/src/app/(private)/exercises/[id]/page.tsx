import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { ExerciseDetail } from "@/features/exercises/components/exercise-detail";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { user, accessToken } = await requireSession(`/exercises/${id}`);
  const result = await exercisesApi.get(id, accessToken);
  if (!result.ok) {
    if (result.error.status === 401) redirect(getLoginUrl(`/exercises/${id}`));
    if (result.error.status === 404) notFound();
    throw new Error(result.error.message);
  }

  const groupsResult =
    result.data.ownerId === user.id
      ? await exercisesApi.muscleGroups(accessToken)
      : null;
  if (groupsResult && !groupsResult.ok)
    throw new Error(groupsResult.error.message);
  return (
    <ExerciseDetail
      key={id}
      exercise={result.data}
      groups={groupsResult?.ok ? groupsResult.data : []}
      user={{ id: user.id, role: user.role }}
    />
  );
}
