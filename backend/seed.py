"""Seed the local database with sample patients and appointments for dev/testing.

Run from backend/ with the venv active: python seed.py
"""
from datetime import date, timedelta

from app.database import Base, SessionLocal, engine
from app.models import Appointment, Patient

SAMPLE_PATIENTS = [
    dict(
        full_name="Alice Fernando",
        date_of_birth=date(1990, 4, 12),
        gender="F",
        phone="+94771234567",
        email="alice@example.com",
        scholarship=False,
        hypertension=True,
        diabetes=False,
        alcoholism=False,
        handicap=0,
    ),
    dict(
        full_name="Nimal Perera",
        date_of_birth=date(1965, 11, 2),
        gender="M",
        phone="+94772345678",
        email="nimal@example.com",
        scholarship=True,
        hypertension=True,
        diabetes=True,
        alcoholism=False,
        handicap=1,
    ),
    dict(
        full_name="Ishara Silva",
        date_of_birth=date(2001, 7, 19),
        gender="F",
        phone="+94773456789",
        email="ishara@example.com",
        scholarship=False,
        hypertension=False,
        diabetes=False,
        alcoholism=False,
        handicap=0,
    ),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Patient).count() > 0:
            print("Database already has patients — skipping seed.")
            return

        today = date.today()
        for i, patient_data in enumerate(SAMPLE_PATIENTS):
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()  # populate patient.id

            db.add(Appointment(
                patient_id=patient.id,
                scheduled_day=today,
                appointment_day=today + timedelta(days=3 + i * 2),
                department="General Medicine",
                sms_received=i % 2 == 0,
                status="scheduled",
            ))

        db.commit()
        print(f"Seeded {len(SAMPLE_PATIENTS)} patients with appointments.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
