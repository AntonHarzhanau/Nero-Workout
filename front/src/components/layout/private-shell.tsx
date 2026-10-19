import type { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { User } from "@/features/auth/contracts";
import { AppSidebar } from "./app-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { PrivateHeader } from "./private-header";

type PrivateShellProps = {
  children: ReactNode;
  user: Pick<User, "name" | "role">;
  dateLabel: string;
};

export function PrivateShell({ children, user, dateLabel }: PrivateShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "220px",
        } as CSSProperties
      }
    >
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-md bg-background px-4 py-2 focus:not-sr-only"
      >
        Aller au contenu
      </a>

      <AppSidebar user={user} />

      <div className="min-w-0 flex-1">
        <PrivateHeader user={user} dateLabel={dateLabel} />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-347.5 px-5 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-9 sm:pt-10 lg:pb-10 xl:px-12 xl:pt-11"
        >
          {children}
        </main>

        <footer className="mx-5 hidden items-center justify-between border-t border-border py-6 text-[10px] text-muted-foreground/60 sm:mx-9 lg:flex xl:mx-12">
          <span>NERO</span>
          <span>Journal d’entraînement</span>
        </footer>
      </div>

      <MobileNavigation />
    </SidebarProvider>
  );
}
