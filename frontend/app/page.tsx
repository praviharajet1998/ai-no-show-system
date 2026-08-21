import Link from "next/link";

import { getAppointmentsWithPredictions } from "@/lib/appointments-with-predictions";
import { BackendUnreachable } from "@/components/backend-unreachable";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  let records;
  try {
    records = await getAppointmentsWithPredictions();
  } catch (err) {
    return <BackendUnreachable error={err} />;
  }

  const sortedRecords = [...records].sort((a, b) =>
    a.appointment.appointment_day.localeCompare(b.appointment.appointment_day)
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            {records.length} upcoming appointment
            {records.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          nativeButton={false}
          render={<Link href="/new">New appointment</Link>}
        />
      </div>

      {sortedRecords.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No appointments yet. Create one to see a no-show risk prediction.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedRecords.map(({ appointment, patient, prediction }) => (
            <Link key={appointment.id} href={`/appointments/${appointment.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{patient?.full_name ?? "Unknown patient"}</CardTitle>
                      <CardDescription>
                        {appointment.appointment_day} · {appointment.department ?? "General"}
                      </CardDescription>
                    </div>
                    {prediction ? (
                      <RiskBadge category={prediction.risk_category} />
                    ) : (
                      <Badge variant="outline">Not yet predicted</Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
