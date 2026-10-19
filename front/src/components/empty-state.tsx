import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <Empty className="min-h-64 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" strokeWidth={1.25} />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-2xl font-normal">
          {title}
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && (
        <EmptyContent className="flex-row flex-wrap justify-center gap-2">
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
