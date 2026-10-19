import { requireCurrentUser } from "@/features/auth/get-current-user";

export default async function ProgressPage() {
  await requireCurrentUser();

  return <h1 className="font-heading text-3xl">Progress</h1>;
}
