import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { NewAppointmentForm } from "@/app/new/new-appointment-form";

export default function NewAppointmentPage() {
  return (
    <div className="flex w-full flex-col gap-6 p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back link & Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to appointments triage</span>
        </Link>

        <div className="flex items-center gap-3 border-b border-border/80 pb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              New Appointment Intake
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Register a patient and booking to trigger instant machine-learning attendance prediction and SHAP feature analysis.
            </p>
          </div>
        </div>
      </div>

      <NewAppointmentForm />
    </div>
  );
}
