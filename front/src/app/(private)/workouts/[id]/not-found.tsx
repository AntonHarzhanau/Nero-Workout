import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
export default function WorkoutNotFound() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Séance introuvable"
      description="Cette séance n’existe plus ou n’est pas accessible avec votre compte."
    >
      <Button nativeButton={false} render={<Link href="/workouts" />}>
        Toutes les séances
      </Button>
    </EmptyState>
  );
}
