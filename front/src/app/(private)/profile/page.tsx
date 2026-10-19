import { requireCurrentUser } from "@/features/auth/get-current-user";
import { ProfileActions } from "@/features/profile/components/profile-actions";
import { ProfileInfo } from "@/features/profile/components/profile-info";
import { PageHeader } from "@/components/page-header";

export default async function ProfilePage() {
  const user = await requireCurrentUser();

  return (
    <section className="space-y-7">
      <PageHeader
        title="Profil"
        description="Vos informations et votre compte."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ProfileInfo user={user} />
        <ProfileActions role={user.role} />
      </div>
    </section>
  );
}
