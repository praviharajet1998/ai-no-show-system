import { NewAppointmentForm } from "@/app/new/new-appointment-form";

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New appointment</h1>
        <p className="text-sm text-muted-foreground">
          Register a patient and appointment to get an instant no-show risk prediction.
        </p>
      </div>
      <NewAppointmentForm />
    </div>
  );
}
