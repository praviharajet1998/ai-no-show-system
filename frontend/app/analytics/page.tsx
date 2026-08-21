import Link from "next/link";

import { getAppointmentsWithPredictions } from "@/lib/appointments-with-predictions";
import { BackendUnreachable } from "@/components/backend-unreachable";
import { RiskBadge } from "@/components/risk-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RiskCategory } from "@/lib/types";

const CATEGORY_ORDER: RiskCategory[] = ["High", "Medium", "Low"];
const CATEGORY_BAR_COLOR: Record<RiskCategory, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-red-500",
};

export default async function AnalyticsPage() {
  let records;
  try {
    records = await getAppointmentsWithPredictions();
  } catch (err) {
    return <BackendUnreachable error={err} />;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const predicted = records.filter((r) => r.prediction);
  const notYetPredicted = records.length - predicted.length;

  const categoryCounts: Record<RiskCategory, number> = { Low: 0, Medium: 0, High: 0 };
  for (const r of predicted) {
    categoryCounts[r.prediction!.risk_category] += 1;
  }

  const recordedOutcomes = records.filter((r) => r.appointment.no_show !== null);
  const noShowCount = recordedOutcomes.filter((r) => r.appointment.no_show === true).length;
  const noShowRate =
    recordedOutcomes.length > 0 ? (noShowCount / recordedOutcomes.length) * 100 : null;

  const upcomingHighRisk = records
    .filter(
      (r) =>
        r.prediction?.risk_category === "High" &&
        r.appointment.no_show === null &&
        r.appointment.appointment_day >= todayStr
    )
    .sort((a, b) => a.appointment.appointment_day.localeCompare(b.appointment.appointment_day))
    .slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics overview</h1>
        <p className="text-sm text-muted-foreground">
          Predicted risk and outcomes across all appointments.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total appointments" value={records.length} />
        <StatCard label="Not yet predicted" value={notYetPredicted} />
        <StatCard
          label="No-show rate"
          value={noShowRate === null ? "—" : `${noShowRate.toFixed(0)}%`}
          hint={
            recordedOutcomes.length > 0
              ? `${recordedOutcomes.length} outcome${recordedOutcomes.length === 1 ? "" : "s"} recorded`
              : "No outcomes recorded yet"
          }
        />
        <StatCard label="Upcoming high risk" value={upcomingHighRisk.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Predicted risk distribution</CardTitle>
          <CardDescription>
            Across {predicted.length} appointment{predicted.length === 1 ? "" : "s"} with a
            prediction.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {predicted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No predictions yet — create an appointment to see risk distribution here.
            </p>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const count = categoryCounts[category];
              const pct = (count / predicted.length) * 100;
              return (
                <div key={category} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground">{category}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", CATEGORY_BAR_COLOR[category])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming high-risk appointments</CardTitle>
          <CardDescription>Prioritize these for outreach before the appointment date.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {upcomingHighRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">None right now.</p>
          ) : (
            upcomingHighRisk.map(({ appointment, patient, prediction }) => (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{patient?.full_name ?? "Unknown patient"}</div>
                  <div className="text-muted-foreground">
                    {appointment.appointment_day} · {appointment.department ?? "General"}
                  </div>
                </div>
                <RiskBadge category={prediction!.risk_category} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}
