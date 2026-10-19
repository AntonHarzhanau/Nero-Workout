import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
export default function PlanNotFound() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Plan introuvable"
      description="Ce plan n’existe plus ou n’est pas accessible avec votre compte."
    >
      <Button nativeButton={false} render={<Link href="/plans" />}>
        Tous les plans
      </Button>
    </EmptyState>
  );
}
