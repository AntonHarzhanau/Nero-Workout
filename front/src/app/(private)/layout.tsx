import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import Link from "next/link";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="text-2xl font-semibold tracking-widest"
          >
            Nero
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.name}</span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
