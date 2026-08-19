import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    scholarship: Mapped[bool] = mapped_column(Boolean, default=False)
    hypertension: Mapped[bool] = mapped_column(Boolean, default=False)
    diabetes: Mapped[bool] = mapped_column(Boolean, default=False)
    alcoholism: Mapped[bool] = mapped_column(Boolean, default=False)
    handicap: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    scheduled_day: Mapped[date] = mapped_column(Date, nullable=False)
    appointment_day: Mapped[date] = mapped_column(Date, nullable=False)
    department: Mapped[str | None] = mapped_column(String)
    sms_received: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="scheduled")
    no_show: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    prediction: Mapped["Prediction"] = relationship(back_populates="appointment", uselist=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("appointments.id"), unique=True, nullable=False)
    risk_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    risk_category: Mapped[str] = mapped_column(String, nullable=False)
    explanation: Mapped[dict] = mapped_column(JSONB, nullable=False)
    recommendation: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    appointment: Mapped["Appointment"] = relationship(back_populates="prediction")
