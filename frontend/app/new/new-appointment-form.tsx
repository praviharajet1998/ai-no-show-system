"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { createAppointmentAction, type NewAppointmentState } from "@/app/new/actions";
import { ContributionList } from "@/components/contribution-list";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialState: NewAppointmentState = {};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewAppointmentForm() {
  const [state, formAction, pending] = useActionState(
    createAppointmentAction,
    initialState
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient</CardTitle>
            <CardDescription>Basic details and known risk factors.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" className="sm:col-span-2">
              <Input id="full_name" name="full_name" required disabled={pending} />
            </Field>
            <Field label="Date of birth" htmlFor="date_of_birth">
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                required
                disabled={pending}
              />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <select
                id="gender"
                name="gender"
                disabled={pending}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                defaultValue=""
              >
                <option value="">Prefer not to say</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="O">Other</option>
              </select>
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" disabled={pending} />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" disabled={pending} />
            </Field>
            <Field label="Handicap level" htmlFor="handicap">
              <select
                id="handicap"
                name="handicap"
                disabled={pending}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                defaultValue="0"
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Separator />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Known conditions
              </span>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Checkbox name="scholarship" label="Scholarship program" disabled={pending} />
                <Checkbox name="hypertension" label="Hypertension" disabled={pending} />
                <Checkbox name="diabetes" label="Diabetes" disabled={pending} />
                <Checkbox name="alcoholism" label="Alcoholism" disabled={pending} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment</CardTitle>
            <CardDescription>When it was scheduled and when it&apos;s happening.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Scheduled on" htmlFor="scheduled_day">
              <Input
                id="scheduled_day"
                name="scheduled_day"
                type="date"
                defaultValue={today()}
                required
                disabled={pending}
              />
            </Field>
            <Field label="Appointment date" htmlFor="appointment_day">
              <Input
                id="appointment_day"
                name="appointment_day"
                type="date"
                required
                disabled={pending}
              />
            </Field>
            <Field label="Department" htmlFor="department" className="sm:col-span-2">
              <Input
                id="department"
                name="department"
                defaultValue="General Medicine"
                disabled={pending}
              />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox name="sms_received" label="SMS reminder sent" disabled={pending} />
            </div>
          </CardContent>
        </Card>

        {state.error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create appointment & predict risk"}
        </Button>
      </form>

      {state.result && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction result</CardTitle>
            <CardDescription>
              For {state.result.patient.full_name} ·{" "}
              <Link
                href={`/appointments/${state.result.appointment.id}`}
                className="underline underline-offset-2"
              >
                view full appointment
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <RiskBadge category={state.result.prediction.risk_category} />
              <span className="text-2xl font-semibold tabular-nums">
                {Math.round(state.result.prediction.risk_score * 100)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {state.result.prediction.recommendation}
            </p>
            <ContributionList contributions={state.result.prediction.explanation} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Checkbox({
  name,
  label,
  disabled,
}: {
  name: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        disabled={disabled}
        className="size-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  );
}
