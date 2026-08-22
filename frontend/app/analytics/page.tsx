import {
  Percent,
  Sparkles,
  AlertTriangle,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Building2,
} from "lucide-react";

import { getAppointmentsWithPredictions } from "@/lib/appointments-with-predictions";
import { BackendUnreachable } from "@/components/backend-unreachable";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { DepartmentBreakdown } from "@/components/charts/department-breakdown";
import { PriorityWorklist } from "@/components/priority-worklist";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RiskCategory } from "@/lib/types";

export default async function AnalyticsPage() {
  let records;
  try {
    records = await getAppointmentsWithPredictions();
  } catch (err) {
    return <BackendUnreachable error={err} />;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Predictions stats
  const predicted = records.filter((r) => r.prediction);
  const predictionCoverage = records.length > 0 ? (predicted.length / records.length) * 100 : 0;

  const categoryCounts: Record<RiskCategory, number> = { Low: 0, Medium: 0, High: 0 };
  for (const r of predicted) {
    categoryCounts[r.prediction!.risk_category] += 1;
  }

  // Outcome stats
  const recordedOutcomes = records.filter((r) => r.appointment.no_show !== null);
  const noShows = recordedOutcomes.filter((r) => r.appointment.no_show === true).length;
  const attended = recordedOutcomes.filter((r) => r.appointment.no_show === false).length;
  const noShowRate =
    recordedOutcomes.length > 0 ? (noShows / recordedOutcomes.length) * 100 : null;

  // Upcoming high/medium risk needing outreach
  const outreachNeeded = records.filter(
    (r) =>
      r.prediction?.risk_category === "High" &&
      r.appointment.no_show === null &&
      r.appointment.appointment_day >= todayStr
  ).length;

  return (
    <div className="flex w-full flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operations & Risk Analytics
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Aggregated predictive performance, department risk exposure, and attendance outcomes.
        </p>
      </div>

      {/* Top 4 KPI Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: No-Show Rate */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Observed No-Show Rate
              </span>
              <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {noShowRate !== null ? `${noShowRate.toFixed(1)}%` : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {recordedOutcomes.length > 0
                  ? `${noShows} no-shows / ${attended} attended`
                  : "No outcomes recorded"}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Percent className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: AI Coverage */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Model Prediction Coverage
              </span>
              <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {predictionCoverage.toFixed(0)}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                {predicted.length} of {records.length} appointments scored
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Sparkles className="size-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: High Risk Cases */}
        <Card className="border-red-500/30 bg-red-500/[0.04] dark:bg-red-950/20 shadow-xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                High-Risk Outreach Pending
              </span>
              <span className="text-2xl font-bold tracking-tight tabular-nums text-red-700 dark:text-red-300">
                {outreachNeeded}
              </span>
              <span className="text-[11px] text-red-600/80 dark:text-red-400/80">
                {categoryCounts.High} high-risk cases total
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/20 text-red-600 dark:text-red-300">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Total Volume */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Total Appointments
              </span>
              <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {records.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Registered across clinic
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarDays className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid: Risk Distribution + Department Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Risk Distribution Donut Card */}
        <Card className="lg:col-span-5 border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base">Predicted Risk Distribution</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Breakdown across {predicted.length} appointments scored by XGBoost.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <RiskDistributionChart counts={categoryCounts} total={predicted.length} />
          </CardContent>
        </Card>

        {/* Department Breakdown Table Card */}
        <Card className="lg:col-span-7 border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <CardTitle className="text-base">Department-Level Risk Exposure</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Compare attendance volume and risk composition across clinic departments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DepartmentBreakdown records={records} />
          </CardContent>
        </Card>
      </div>

      {/* Actionable Priority Worklist */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-primary" />
              <div>
                <CardTitle className="text-base">
                  Upcoming Priority Outreach Worklist
                </CardTitle>
                <CardDescription className="text-xs">
                  Prioritize these patients for proactive confirmation calls and reminders before their appointment date.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PriorityWorklist records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
