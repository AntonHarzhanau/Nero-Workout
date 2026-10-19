import { PrivateShell } from "@/components/layout/private-shell";
import { requireCurrentUser } from "@/features/auth/get-current-user";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date());

  return (
    <PrivateShell
      user={{
        name: user.name,
        role: user.role,
      }}
      dateLabel={dateLabel}
    >
      {children}
    </PrivateShell>
  );
}
