"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavigationActive, navigationItems } from "./navigation";

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-sidebar/95 px-1 pt-3 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isNavigationActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 min-w-0 flex-col items-center gap-1.5 rounded-md px-1 text-[9px]",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "text-sidebar-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <Icon
              aria-hidden="true"
              className="size-4.75"
              strokeWidth={1.6}
            />

            <span className="max-w-full truncate">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
