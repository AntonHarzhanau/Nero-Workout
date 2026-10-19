import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatWorkoutMonth } from "../formatters";

type WorkoutsFiltersProps = {
  search: string;
  month: string;
  months: string[];
  onSearchChange: (value: string) => void;
  onMonthChange: (value: string) => void;
};
export function WorkoutsFilters({
  search,
  month,
  months,
  onSearchChange,
  onMonthChange,
}: WorkoutsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          className="bg-card pl-9"
          placeholder="Rechercher une séance"
          aria-label="Rechercher une séance"
          value={search}
          maxLength={120}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <NativeSelect
        aria-label="Filtrer les séances par mois"
        value={month}
        onChange={(event) => onMonthChange(event.target.value)}
      >
        <option value="all">Tous les mois</option>
        {months.map((value) => (
          <option key={value} value={value}>
            {formatWorkoutMonth(value)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
