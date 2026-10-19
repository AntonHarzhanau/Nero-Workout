import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  backLink?: { href: string; label: string };
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  backLink,
  children,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {backLink && (
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={backLink.href} />}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft aria-hidden="true" />
          {backLink.label}
        </Button>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 space-y-2">
          <h1 className="wrap-break-words font-heading text-3xl sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}
