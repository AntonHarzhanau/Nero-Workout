import { requireCurrentUser } from "@/features/auth/get-current-user";
import { ProfileActions } from "@/features/profile/components/profile-actions";
import { ProfileInfo } from "@/features/profile/components/profile-info";

export default async function ProfilePage() {
  const user = await requireCurrentUser();

  return (
    <section className="space-y-7">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl">Profil</h1>

        <p className="text-sm text-muted-foreground">
          Vos informations et votre compte.
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ProfileInfo user={user} />
        <ProfileActions role={user.role} />
      </div>
    </section>
  );
}
