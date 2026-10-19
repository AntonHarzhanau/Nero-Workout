import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LucideIcon,
  UserRound,
  UsersRound,
} from "lucide-react";

type NavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Aperçu",
    shortLabel: "Aperçu",
    icon: LayoutDashboard,
  },
  {
    href: "/workouts",
    label: "Séances",
    shortLabel: "Séances",
    icon: CalendarDays,
  },
  {
    href: "/plans",
    label: "Plans",
    shortLabel: "Plans",
    icon: ClipboardList,
  },
  {
    href: "/exercises",
    label: "Exercices",
    shortLabel: "Exercices",
    icon: Dumbbell,
  },
  {
    href: "/progress",
    label: "Progression",
    shortLabel: "Progrès",
    icon: ChartNoAxesCombined,
  },
];

export const profileItem: NavigationItem = {
  href: "/profile",
  label: "Profil",
  shortLabel: "Profil",
  icon: UserRound,
};

export const usersItem: NavigationItem = {
  href: "/users",
  label: "Utilisateurs",
  shortLabel: "Utilisateurs",
  icon: UsersRound,
};

export function isNavigationActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
