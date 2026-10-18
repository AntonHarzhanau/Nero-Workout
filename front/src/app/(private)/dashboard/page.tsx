import { requireCurrentUser } from "@/features/auth/get-current-user";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-3xl">Bonjour, {user.name}</h1>

      <p className="text-muted-foreground">
        Bienvenue sur votre tableau de bord.
      </p>
    </section>
  );
}
