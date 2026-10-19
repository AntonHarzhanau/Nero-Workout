import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { User } from "@/features/auth/contracts";
import { DeleteAccountButton } from "./delete-account-button";

type ProfileActionsProps = {
  role: User["role"];
};

export function ProfileActions({ role }: ProfileActionsProps) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>

          <CardDescription>
            Déconnectez-vous de votre compte sur cet appareil.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>

      {role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>

            <CardDescription>
              Accédez à la gestion des utilisateurs.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/users" />}
              className="w-full"
            >
              <UsersRound aria-hidden="true" />
              Gérer les utilisateurs
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            Supprimer mon compte
          </CardTitle>

          <CardDescription>
            Supprimez définitivement votre compte et vos données personnelles
            d’entraînement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
