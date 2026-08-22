import Link from "next/link";
import { Phone, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

import type { AppointmentRecord } from "@/lib/appointments-with-predictions";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";

interface PriorityWorklistProps {
  records: AppointmentRecord[];
}

export function PriorityWorklist({ records }: PriorityWorklistProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter for upcoming high/medium risk appointments without recorded outcome
  const worklist = records
    .filter(
      (r) =>
        (r.prediction?.risk_category === "High" || r.prediction?.risk_category === "Medium") &&
        r.appointment.no_show === null &&
        r.appointment.appointment_day >= todayStr
    )
    .sort((a, b) => {
      // Sort High risk first, then by date
      if (a.prediction?.risk_category !== b.prediction?.risk_category) {
        return a.prediction?.risk_category === "High" ? -1 : 1;
      }
      return a.appointment.appointment_day.localeCompare(b.appointment.appointment_day);
    });

  if (worklist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/80 bg-card py-10 text-center shadow-xs">
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5" />
        </div>
        <span className="font-semibold text-foreground text-sm">All caught up!</span>
        <p className="text-xs text-muted-foreground max-w-xs">
          No upcoming high or medium risk appointments requiring urgent front-desk outreach.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {worklist.map(({ appointment, patient, prediction }) => {
        const isHigh = prediction?.risk_category === "High";

        return (
          <div
            key={appointment.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors shadow-xs ${
              isHigh
                ? "border-red-500/30 bg-red-500/[0.03] hover:bg-red-500/[0.06] dark:bg-red-950/20"
                : "border-border/80 bg-card hover:bg-muted/40"
            }`}
          >
            {/* Left: Patient & Contact */}
            <div className="flex items-start gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                  isHigh
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isHigh ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">
                    {patient?.full_name ?? "Unknown Patient"}
                  </span>
                  <RiskBadge
                    category={prediction!.risk_category}
                    score={prediction!.risk_score}
                    size="sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    📅 {appointment.appointment_day}
                  </span>
                  <span>•</span>
                  <span>{appointment.department ?? "General Medicine"}</span>
                  {patient?.phone && (
                    <>
                      <span>•</span>
                      <a
                        href={`tel:${patient.phone}`}
                        className="flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <Phone className="size-3" />
                        {patient.phone}
                      </a>
                    </>
                  )}
                </div>

                <p className="mt-1 text-xs font-medium text-red-700/90 dark:text-red-300/90">
                  {prediction!.recommendation}
                </p>
              </div>
            </div>

            {/* Right: Action */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8"
                nativeButton={false}
                render={
                  <Link href={`/appointments/${appointment.id}`}>
                    <span>View Record</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
