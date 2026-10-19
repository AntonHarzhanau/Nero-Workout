"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { PlanSummary } from "../contracts";
import { PlanCard } from "./plan-card";
import { PlanFormDialog } from "./plan-form-dialog";
export function PlansCatalog({
  plans,
  groups,
  isAdmin,
}: {
  plans: PlanSummary[];
  groups: MuscleGroup[];
  isAdmin: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const createButton = (
    <Button type="button" onClick={() => setCreating(true)}>
      <Plus aria-hidden="true" />
      Créer un plan
    </Button>
  );
  return (
    <section className="space-y-7">
      <PageHeader
        title="Plans d’entraînement"
        description="Préparez une séance et réutilisez-la à votre rythme."
      >
        {createButton}
      </PageHeader>
      {plans.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Aucun plan pour le moment"
          description="Choisissez vos exercices, vos séries et vos poids pour préparer vos prochaines séances."
        >
          {createButton}
        </EmptyState>
      )}
      {creating && (
        <PlanFormDialog
          groups={groups}
          isAdmin={isAdmin}
          onClose={() => setCreating(false)}
          onSaved={(plan) => {
            setCreating(false);
            router.push(`/plans/${plan.id}`);
          }}
        />
      )}
    </section>
  );
}
