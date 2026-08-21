export type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  scholarship: boolean;
  hypertension: boolean;
  diabetes: boolean;
  alcoholism: boolean;
  handicap: number;
  created_at: string;
};

export type PatientInput = Omit<Patient, "id" | "created_at">;

export type Appointment = {
  id: string;
  patient_id: string;
  scheduled_day: string;
  appointment_day: string;
  department: string | null;
  sms_received: boolean;
  status: string;
  no_show: boolean | null;
  created_at: string;
};

export type AppointmentInput = Omit<
  Appointment,
  "id" | "status" | "no_show" | "created_at"
>;

export type RiskCategory = "Low" | "Medium" | "High";

export type FeatureContribution = {
  feature: string;
  contribution: number;
  value: number;
};

export type PredictFeatures = {
  Age: number;
  Scholarship: number;
  Hipertension: number;
  Diabetes: number;
  Alcoholism: number;
  Handcap: number;
  SMS_received: number;
  DaysAhead: number;
  DayOfWeek: number;
  IsWeekend: number;
  Month: number;
};

export type PredictionResult = {
  risk_score: number;
  risk_category: RiskCategory;
  explanation: FeatureContribution[];
  recommendation: string;
};

export type StoredPrediction = PredictionResult & {
  id: string;
  appointment_id: string;
  created_at: string;
};
