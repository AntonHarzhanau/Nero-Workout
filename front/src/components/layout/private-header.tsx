"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, UsersRound } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/auth/contracts";
import { Brand } from "./brand";
import { UserAvatar } from "./user-avatar";
import {
  isNavigationActive,
  navigationItems,
  profileItem,
  usersItem,
} from "./navigation";

type PrivateHeaderProps = {
  user: Pick<User, "name" | "role">;
  dateLabel: string;
};

export function PrivateHeader({ user, dateLabel }: PrivateHeaderProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  const sections = [
    ...navigationItems,
    profileItem,
    ...(isAdmin ? [usersItem] : []),
  ];

  const currentSection = sections.find((item) =>
    isNavigationActive(pathname, item.href),
  );

  return (
    <header className="flex h-18 items-center justify-between gap-4 border-b border-border px-5 sm:px-9 xl:px-12">
      <Link
        href="/dashboard"
        aria-label="NERO, vue d’ensemble"
        className="lg:hidden"
      >
        <Brand />
      </Link>

      <Breadcrumb className="hidden lg:block">
        <BreadcrumbList className="gap-3 text-[11px]">
          <BreadcrumbItem>
            <span className="text-muted-foreground">Espace personnel</span>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>{currentSection?.label ?? "NERO"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 sm:gap-6">
        <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
          <CalendarDays
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.5}
          />

          {dateLabel}
        </span>

        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/users" />}
            aria-label="Utilisateurs"
            className="lg:hidden"
          >
            <UsersRound aria-hidden="true" />
          </Button>
        )}

        <Link
          href="/profile"
          aria-label="Ouvrir mon profil"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            name={user.name}
            className="size-8 transition-colors hover:border-primary/70"
          />
        </Link>
      </div>
    </header>
  );
}
