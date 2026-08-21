import type {
  Appointment,
  AppointmentInput,
  Patient,
  PatientInput,
  PredictFeatures,
  PredictionResult,
  StoredPrediction,
} from "@/lib/types";

const API_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (API_KEY) headers.set("X-API-Key", API_KEY);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listPatients() {
  return apiFetch<Patient[]>("/patients");
}

export function getPatient(id: string) {
  return apiFetch<Patient>(`/patients/${id}`);
}

export function createPatient(data: PatientInput) {
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listAppointments(patientId?: string) {
  const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return apiFetch<Appointment[]>(`/appointments${qs}`);
}

export function getAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}`);
}

export function createAppointment(data: AppointmentInput) {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAppointmentOutcome(appointmentId: string, noShow: boolean) {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/outcome`, {
    method: "PATCH",
    body: JSON.stringify({ no_show: noShow }),
  });
}

export function getPrediction(appointmentId: string) {
  return apiFetch<StoredPrediction>(`/appointments/${appointmentId}/prediction`);
}

export function predict(appointmentId: string, features: PredictFeatures) {
  return apiFetch<PredictionResult>("/predict", {
    method: "POST",
    body: JSON.stringify({ appointment_id: appointmentId, ...features }),
  });
}
