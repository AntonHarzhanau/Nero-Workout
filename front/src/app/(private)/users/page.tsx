import { requireCurrentUser } from "@/features/auth/get-current-user";
import { notFound } from "next/navigation";

export default async function UsersPage() {
  const user = await requireCurrentUser();

  if (user.role !== "admin") {
    notFound();
  }

  return (
    <section className="space-y-4">
        <h1 className="font-heading text-3xl">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des utilisateurs.
        </p>
    </section>
  )
}
