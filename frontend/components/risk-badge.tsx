import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskCategory } from "@/lib/types";

const STYLES: Record<RiskCategory, string> = {
  Low: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  Medium: "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  High: "border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-400",
};

export function RiskBadge({ category }: { category: RiskCategory }) {
  return (
    <Badge variant="outline" className={cn(STYLES[category])}>
      {category} risk
    </Badge>
  );
}
