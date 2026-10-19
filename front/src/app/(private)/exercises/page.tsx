import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/require-session";
import { getLoginUrl } from "@/features/auth/return-to";
import {
  exercisesHref,
  readExercisesQuery,
  type ExercisesSearchParams,
} from "@/features/exercises/query";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { ExercisesCatalog } from "@/features/exercises/components/exercises-catalog";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<ExercisesSearchParams>;
}) {
  const query = readExercisesQuery(await searchParams);
  const { user, accessToken } = await requireSession(exercisesHref(query));
  const [exercisesResult, groupsResult] = await Promise.all([
    exercisesApi.list(query, accessToken),
    exercisesApi.muscleGroups(accessToken),
  ]);
  if (!exercisesResult.ok) {
    if (exercisesResult.error.status === 401)
      redirect(getLoginUrl(exercisesHref(query)));
    throw new Error(exercisesResult.error.message);
  }
  if (!groupsResult.ok) {
    if (groupsResult.error.status === 401)
      redirect(getLoginUrl(exercisesHref(query)));
    throw new Error(groupsResult.error.message);
  }
  const lastPage = Math.max(1, exercisesResult.data.meta.totalPages);
  if (query.page > lastPage)
    redirect(exercisesHref({ ...query, page: lastPage }));
  return (
    <ExercisesCatalog
      result={exercisesResult.data}
      groups={groupsResult.data}
      query={query}
      user={{ id: user.id, role: user.role }}
    />
  );
}
