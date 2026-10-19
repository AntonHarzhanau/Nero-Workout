import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/features/auth/contracts";
import { DeleteUserButton } from "./delete-user-button";

type UsersTableProps = {
  users: User[];
  currentUserId: string;
};

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  return (
    <Table>
      <TableCaption className="sr-only">Liste des utilisateurs.</TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Inscription</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              Aucun utilisateur.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isAdmin = user.role === "admin";

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>

                    {isCurrentUser && <Badge variant="outline">Vous</Badge>}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </TableCell>

                <TableCell>{user.email}</TableCell>

                <TableCell>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {isAdmin ? "Administrateur" : "Standard"}
                  </Badge>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <time dateTime={user.createdAt}>
                    {dateFormatter.format(new Date(user.createdAt))}
                  </time>
                </TableCell>

                <TableCell className="text-right">
                  {!isAdmin && !isCurrentUser ? (
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isCurrentUser ? "Depuis votre profil" : "Compte protégé"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
