"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { Plan } from "../contracts";
import { usePlanForm } from "../hooks/use-plan-form";
import { PlanForm } from "./plan-form";
export function PlanEditForm({
  plan,
  groups,
  isAdmin,
  onSaved,
  onCancel,
}: {
  plan: Plan;
  groups: MuscleGroup[];
  isAdmin: boolean;
  onSaved: (plan: Plan) => void;
  onCancel: () => void;
}) {
  const form = usePlanForm({ plan, onSaved });
  return (
    <Card>
      <CardContent>
        <PlanForm
          form={form}
          groups={groups}
          isAdmin={isAdmin}
          editing
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
}
