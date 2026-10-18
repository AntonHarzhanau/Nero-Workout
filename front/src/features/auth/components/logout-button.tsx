"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions/logout";

export function LogoutButton() {
  const [state, action, pending] = useActionState(logoutAction, null);

  return (
    <form action={action} className="space-y-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Déconnexion..." : "Se déconnecter"}
      </Button>

      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
