import { requireCurrentUser } from "@/features/auth/get-current-user";

export default async function ExercisesPage() {
  await requireCurrentUser();

  return <h1 className="font-heading text-3xl">Exercises</h1>;
}
