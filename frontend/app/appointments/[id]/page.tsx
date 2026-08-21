import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ApiError, getAppointment, getPatient, getPrediction } from "@/lib/api";
import { OutcomeActions } from "@/app/appointments/[id]/outcome-actions";
import { ContributionList } from "@/components/contribution-list";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const appointment = await getAppointment(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  const patient = await getPatient(appointment.patient_id);

  const prediction = await getPrediction(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to appointments
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{patient.full_name}</CardTitle>
          <CardDescription>
            {appointment.appointment_day} · {appointment.department ?? "General"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label="Scheduled on">{appointment.scheduled_day}</Row>
          <Row label="Status">
            <Badge variant="secondary">{appointment.status}</Badge>
          </Row>
          <Row label="SMS reminder">{appointment.sms_received ? "Yes" : "No"}</Row>
          <Row label="Outcome">
            <OutcomeCell appointmentId={appointment.id} noShow={appointment.no_show} appointmentDay={appointment.appointment_day} />
          </Row>
          <Row label="Date of birth">{patient.date_of_birth}</Row>
          <Row label="Conditions">
            {[
              patient.hypertension && "Hypertension",
              patient.diabetes && "Diabetes",
              patient.alcoholism && "Alcoholism",
              patient.scholarship && "Scholarship program",
            ]
              .filter(Boolean)
              .join(", ") || "None recorded"}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>No-show risk</CardTitle>
        </CardHeader>
        <CardContent>
          {prediction ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <RiskBadge category={prediction.risk_category} />
                <span className="text-2xl font-semibold tabular-nums">
                  {Math.round(prediction.risk_score * 100)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{prediction.recommendation}</p>
              <ContributionList contributions={prediction.explanation} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No prediction has been run for this appointment yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function OutcomeCell({
  appointmentId,
  noShow,
  appointmentDay,
}: {
  appointmentId: string;
  noShow: boolean | null;
  appointmentDay: string;
}) {
  if (noShow !== null) {
    return (
      <Badge variant={noShow ? "destructive" : "secondary"}>
        {noShow ? "No-show" : "Attended"}
      </Badge>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (appointmentDay > todayStr) {
    return <span className="text-sm text-muted-foreground">Recorded after the appointment</span>;
  }

  return <OutcomeActions appointmentId={appointmentId} />;
}
