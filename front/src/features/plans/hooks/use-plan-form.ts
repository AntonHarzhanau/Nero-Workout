"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionForm } from "@/hooks/use-action-form";
import { toTrainingDraft, toTrainingPayload } from "@/features/training/drafts";
import { savePlanAction } from "../actions";
import { planFormSchema, type Plan, type PlanFormValues } from "../contracts";

export function usePlanForm({
  plan,
  onSaved,
}: {
  plan?: Plan;
  onSaved: (plan: Plan) => void;
}) {
  return useActionForm<PlanFormValues>({
    fields: ["title", "description", "exercises"],
    action: async (values) => {
      const payload = {
        title: values.title,
        description: values.description.trim() || null,
        exercises: toTrainingPayload(values.exercises),
      };
      const result = await savePlanAction(plan?.id ?? null, payload);
      if (!result.ok) return result.error;
      onSaved(result.data);
    },
    formOptions: {
      resolver: zodResolver(planFormSchema),
      defaultValues: {
        title: plan?.title ?? "",
        description: plan?.description ?? "",
        exercises: toTrainingDraft(plan?.exercises ?? []),
      },
    },
  });
}
