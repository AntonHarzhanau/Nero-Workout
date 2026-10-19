"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { User } from "@/features/auth/contracts";
import { Brand } from "./brand";
import { UserAvatar } from "./user-avatar";
import { isNavigationActive, navigationItems, usersItem } from "./navigation";

type AppSidebarProps = {
  user: Pick<User, "name" | "role">;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const items =
    user.role === "admin" ? [...navigationItems, usersItem] : navigationItems;

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border lg:flex"
    >
      <SidebarHeader className="px-8 pt-8 pb-10">
        <Link href="/dashboard" aria-label="NERO, vue d’ensemble">
          <Brand />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Entraînement
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <nav aria-label="Navigation principale">
              <SidebarMenu className="gap-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavigationActive(pathname, item.href);

                  return (
                    <SidebarMenuItem
                      key={item.href}
                      className={
                        item.href === usersItem.href ? "mt-6" : undefined
                      }
                    >
                      <SidebarMenuButton
                        render={
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                          />
                        }
                        isActive={active}
                        className="h-11 gap-3 px-3.5 text-[13px] data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-4.25"
                          strokeWidth={1.6}
                        />

                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-4 px-5 pb-8">
        <Separator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={isNavigationActive(pathname, "/profile")}
              className="h-auto gap-3 py-2"
            >
              <UserAvatar name={user.name} />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{user.name}</span>

                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Mon compte
                </span>
              </span>

              <ChevronRight
                aria-hidden="true"
                className="size-3 text-muted-foreground"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
