import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLoginUrl } from "@/features/auth/return-to";
import { UsersTable } from "@/features/users/components/users-table";
import { requireAdmin } from "@/features/users/require-admin";
import { usersApi } from "@/features/users/users-api";
import { PageHeader } from "@/components/page-header";

export default async function UsersPage() {
  const { user: admin, accessToken } = await requireAdmin();

  const result = await usersApi.list(accessToken);

  if (!result.ok) {
    if (result.error.status === 401) {
      redirect(getLoginUrl("/users"));
    }

    if (result.error.status === 403) {
      notFound();
    }

    throw new Error(result.error.message);
  }

  const users = result.data.items;

  return (
    <section className="space-y-7">
      <PageHeader
        title="Utilisateurs"
        description="Consultez les comptes et gérez les utilisateurs."
      />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Comptes ({users.length})</CardTitle>

          <CardDescription>
            La suppression d’un compte supprime également ses données
            personnelles d’entraînement.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UsersTable users={users} currentUserId={admin.id} />
        </CardContent>
      </Card>
    </section>
  );
}
