import { getPrediction, listAppointments, listPatients } from "@/lib/api";
import type { Appointment, Patient, StoredPrediction } from "@/lib/types";

export type AppointmentRecord = {
  appointment: Appointment;
  patient: Patient | undefined;
  prediction: StoredPrediction | undefined;
};

// Shared by the appointments list and the analytics overview — both need
// appointments joined against their patient and (if run) their prediction.
export async function getAppointmentsWithPredictions(): Promise<AppointmentRecord[]> {
  const [appointments, patients] = await Promise.all([listAppointments(), listPatients()]);

  const predictionResults = await Promise.allSettled(
    appointments.map((appointment) => getPrediction(appointment.id))
  );

  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  return appointments.map((appointment, index) => {
    const result = predictionResults[index];
    return {
      appointment,
      patient: patientById.get(appointment.patient_id),
      prediction: result.status === "fulfilled" ? result.value : undefined,
    };
  });
}
