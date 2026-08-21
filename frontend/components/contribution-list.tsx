import { cn } from "@/lib/utils";
import type { FeatureContribution } from "@/lib/types";

export function ContributionList({
  contributions,
}: {
  contributions: FeatureContribution[];
}) {
  const maxAbs = Math.max(
    ...contributions.map((c) => Math.abs(c.contribution)),
    0.0001
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Top contributing factors
      </span>
      {contributions.map((c) => {
        const isPositive = c.contribution >= 0;
        const width = (Math.abs(c.contribution) / maxAbs) * 100;
        return (
          <div key={c.feature} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 truncate text-muted-foreground">
              {c.feature}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  isPositive ? "bg-red-500" : "bg-emerald-500"
                )}
                style={{ width: `${width}%` }}
              />
            </div>
            <span
              className={cn(
                "w-16 shrink-0 text-right tabular-nums",
                isPositive ? "text-red-600" : "text-emerald-600"
              )}
            >
              {isPositive ? "+" : ""}
              {c.contribution.toFixed(3)}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-muted-foreground">
        Red pushes no-show risk up, green pushes it down.
      </p>
    </div>
  );
}
