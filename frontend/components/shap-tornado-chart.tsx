import { TrendingUp, TrendingDown, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FeatureContribution } from "@/lib/types";

interface ShapTornadoChartProps {
  contributions: FeatureContribution[];
  className?: string;
}

const FEATURE_FORMATTERS: Record<
  string,
  (value: number) => { title: string; subtitle: string }
> = {
  Age: (v) => ({
    title: "Patient Age",
    subtitle: `${Math.round(v)} years old`,
  }),
  DaysAhead: (v) => ({
    title: "Lead Time (Scheduled in Advance)",
    subtitle: `${Math.round(v)} day${Math.round(v) === 1 ? "" : "s"} ahead`,
  }),
  SMS_received: (v) => ({
    title: "SMS Reminder",
    subtitle: v === 1 ? "Reminder sent" : "No reminder sent",
  }),
  Hipertension: (v) => ({
    title: "Hypertension History",
    subtitle: v === 1 ? "Present" : "None recorded",
  }),
  Diabetes: (v) => ({
    title: "Diabetes History",
    subtitle: v === 1 ? "Present" : "None recorded",
  }),
  Scholarship: (v) => ({
    title: "Bolsa Família / Scholarship",
    subtitle: v === 1 ? "Enrolled in program" : "Not enrolled",
  }),
  Alcoholism: (v) => ({
    title: "Alcoholism History",
    subtitle: v === 1 ? "Present" : "None recorded",
  }),
  Handcap: (v) => ({
    title: "Handicap Severity",
    subtitle: `Level ${Math.round(v)} of 4`,
  }),
  DayOfWeek: (v) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return {
      title: "Appointment Day of Week",
      subtitle: days[Math.round(v)] ?? `Day ${v}`,
    };
  },
  IsWeekend: (v) => ({
    title: "Weekend vs Weekday",
    subtitle: v === 1 ? "Scheduled on weekend" : "Scheduled on weekday",
  }),
  Month: (v) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return {
      title: "Appointment Month",
      subtitle: months[Math.round(v) - 1] ?? `Month ${v}`,
    };
  },
};

function formatFeature(feature: string, value: number) {
  const formatter = FEATURE_FORMATTERS[feature];
  if (formatter) return formatter(value);
  return {
    title: feature.replace(/([A-Z])/g, " $1").trim(),
    subtitle: `Value: ${value}`,
  };
}

export function ShapTornadoChart({ contributions, className }: ShapTornadoChartProps) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        No feature contribution data available for this prediction.
      </div>
    );
  }

  // Max absolute contribution to scale bars relative to each other
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.001);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Legend & Explainer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs">
        <span className="font-semibold text-foreground">
          Top SHAP Contributing Factors
        </span>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            <TrendingDown className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Lowers Risk</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500" />
            <TrendingUp className="size-3 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300 font-medium">Raises Risk</span>
          </span>
        </div>
      </div>

      {/* Tornado Rows */}
      <div className="flex flex-col gap-2.5">
        {contributions.map((c) => {
          const isPositive = c.contribution >= 0;
          const { title, subtitle } = formatFeature(c.feature, c.value);
          const barWidthPercent = (Math.abs(c.contribution) / maxAbs) * 100;

          return (
            <div
              key={c.feature}
              className="group flex flex-col gap-1 rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
            >
              {/* Top row: Feature label + Raw value + Signed impact */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-medium text-foreground truncate">{title}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground shrink-0">
                    {subtitle}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 font-semibold tabular-nums shrink-0 text-xs",
                    isPositive
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {c.contribution.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Bottom row: Center-aligned diverging bar */}
              <div className="relative flex h-2.5 w-full items-center rounded-full bg-muted/60 overflow-hidden">
                {/* 50% Zero Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-border z-10" />

                {/* Left (Protective / Lower risk) Bar */}
                {!isPositive && (
                  <div className="flex h-full w-1/2 justify-end">
                    <div
                      className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                )}

                {/* Right (Risk-increasing) Bar */}
                {isPositive && (
                  <div className="flex h-full w-1/2 ml-auto">
                    <div
                      className="h-full rounded-r-full bg-red-500 transition-all duration-500"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <Info className="size-3.5 shrink-0 mt-0.5" />
        <span>
          SHAP (SHapley Additive exPlanations) isolates each feature&apos;s exact contribution to the XGBoost prediction for this individual patient.
        </span>
      </div>
    </div>
  );
}
