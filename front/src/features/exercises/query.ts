import { z } from "zod";

export type ExercisesSearchParams = Record<
  string,
  string | string[] | undefined
>;

const exercisesQuerySchema = z.object({
  search: z.string().trim().max(120).catch(""),
  scope: z.enum(["all", "mine", "public"]).catch("all"),
  muscleGroupId: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});

export type ExercisesQuery = z.infer<typeof exercisesQuerySchema>;

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readExercisesQuery(
  params: ExercisesSearchParams,
): ExercisesQuery {
  return exercisesQuerySchema.parse({
    search: getSingleSearchParam(params.search),
    scope: getSingleSearchParam(params.scope),
    muscleGroupId: getSingleSearchParam(params.muscleGroupId),
    page: getSingleSearchParam(params.page),
  });
}

export function exercisesHref(query: Partial<ExercisesQuery> = {}): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.scope && query.scope !== "all") params.set("scope", query.scope);
  if (query.muscleGroupId) params.set("muscleGroupId", query.muscleGroupId);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/exercises?${search}` : "/exercises";
}
