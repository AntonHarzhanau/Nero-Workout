import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/http/pagination";

type ListPaginationProps = {
  meta: PaginationMeta;
  pending: boolean;
  onPageChange: (page: number) => void;
};

export function ListPagination({
  meta,
  pending,
  onPageChange,
}: ListPaginationProps) {
  if (meta.total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
    >
      <div className="flex items-center gap-2 ml-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Page précédente"
          disabled={pending || !meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Page suivante"
          disabled={pending || !meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
