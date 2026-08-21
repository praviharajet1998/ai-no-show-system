import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    scholarship: bool = False
    hypertension: bool = False
    diabetes: bool = False
    alcoholism: bool = False
    handicap: int = 0


class PatientOut(PatientCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    scheduled_day: date
    appointment_day: date
    department: str | None = None
    sms_received: bool = False


class AppointmentOut(AppointmentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    no_show: bool | None
    created_at: datetime


class AppointmentOutcomeUpdate(BaseModel):
    no_show: bool


class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    value: float


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    appointment_id: uuid.UUID
    risk_score: float
    risk_category: str
    explanation: list[FeatureContribution]
    recommendation: str
    created_at: datetime
