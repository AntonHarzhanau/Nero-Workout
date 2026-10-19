import { UserAvatar } from "@/components/layout/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/features/auth/contracts";

type ProfileInformationProps = {
  user: User;
};

export function ProfileInfo({ user }: ProfileInformationProps) {
  const isAdmin = user.role === "admin";

  const registrationDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(user.createdAt));

  const information = [
    {
      label: "Nom",
      value: user.name,
    },
    {
      label: "Nom d’utilisateur",
      value: `@${user.username}`,
    },
    {
      label: "Adresse email",
      value: user.email,
    },
    {
      label: "Membre depuis le",
      value: registrationDate,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} className="size-14" />

          <div className="min-w-0 space-y-2">
            <CardTitle className="wrap-break-words font-heading text-2xl font-normal">
              {user.name}
            </CardTitle>

            <CardDescription className="break-all">
              @{user.username}
            </CardDescription>

            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Administrateur" : "Compte personnel"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />

        <dl className="grid gap-6 sm:grid-cols-2">
          {information.map((item) => (
            <div key={item.label} className="min-w-0 space-y-1.5">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>

              <dd className="wrap-break-words text-sm wrap-anywhere">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
