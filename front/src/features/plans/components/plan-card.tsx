import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanSummary } from "../contracts";
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});
export function PlanCard({ plan }: { plan: PlanSummary }) {
  return (
    <Link
      href={`/plans/${plan.id}`}
      className="group min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors group-hover:bg-accent/40 group-hover:ring-primary/30">
        <CardContent className="h-full gap-0">
          <span className="mb-6 flex size-9 items-center justify-center rounded-md border border-primary/15 bg-primary/5">
            <ClipboardList
              aria-hidden="true"
              className="size-4 text-primary/70"
              strokeWidth={1.5}
            />
          </span>
          <h2 className="wrap-break-words font-heading text-[29px] leading-tight">
            {plan.title}
          </h2>
          <p className="mt-3 mb-6 line-clamp-3 wrap-break-words text-sm leading-6 text-muted-foreground">
            {plan.description || "Votre prochaine séance commence ici."}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
            <span>
              Mis à jour le {dateFormat.format(new Date(plan.updatedAt))}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 transition group-hover:text-foreground"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
