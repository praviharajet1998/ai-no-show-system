import logging
import time
import uuid
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import pickle
import os

from app import models, schemas
from app.database import get_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("noshow_api")

# ======================
# Load Model & Explainer
# ======================
MODEL_PATH = "models/xgboost_model.pkl"
EXPLAINER_PATH = "models/shap_explainer.pkl"

if not os.path.exists(MODEL_PATH) or not os.path.exists(EXPLAINER_PATH):
    raise FileNotFoundError("Model or SHAP explainer not found. Please run train.py first.")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

with open(EXPLAINER_PATH, "rb") as f:
    explainer = pickle.load(f)

# Feature order must match training
FEATURE_COLUMNS = [
    "Age", "Scholarship", "Hipertension", "Diabetes", "Alcoholism",
    "Handcap", "SMS_received", "DaysAhead", "DayOfWeek", "IsWeekend", "Month"
]

# ======================
# FastAPI App
# ======================
app = FastAPI(
    title="AI Patient No-Show Prediction System",
    description="Predicts patient no-show risk with SHAP explanations",
    version="1.0.0"
)

# Allow frontend (Next.js) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# Auth + request logging
# ======================
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    logger.warning(
        "API_KEY is not set — all endpoints are unauthenticated. "
        "Set API_KEY in the environment before deploying anywhere non-local."
    )

PUBLIC_PATHS = {"/", "/health", "/docs", "/redoc", "/openapi.json"}


@app.middleware("http")
async def auth_and_logging(request: Request, call_next):
    start = time.monotonic()

    if API_KEY and request.url.path not in PUBLIC_PATHS:
        if request.headers.get("x-api-key") != API_KEY:
            duration_ms = (time.monotonic() - start) * 1000
            logger.info("%s %s -> 401 (%.1fms)", request.method, request.url.path, duration_ms)
            return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})

    response = await call_next(request)
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s -> %d (%.1fms)", request.method, request.url.path, response.status_code, duration_ms
    )
    return response

# ======================
# Request & Response Models
# ======================
class AppointmentRequest(BaseModel):
    appointment_id: uuid.UUID = Field(..., description="ID of an existing appointment to attach this prediction to")
    Age: int = Field(..., ge=0, le=120, example=45)
    Scholarship: int = Field(..., ge=0, le=1, example=0)
    Hipertension: int = Field(..., ge=0, le=1, example=1)
    Diabetes: int = Field(..., ge=0, le=1, example=0)
    Alcoholism: int = Field(..., ge=0, le=1, example=0)
    Handcap: int = Field(..., ge=0, le=4, example=0)
    SMS_received: int = Field(..., ge=0, le=1, example=1)
    DaysAhead: int = Field(..., ge=0, example=7)
    DayOfWeek: int = Field(..., ge=0, le=6, example=2)   # 0=Monday
    IsWeekend: int = Field(..., ge=0, le=1, example=0)
    Month: int = Field(..., ge=1, le=12, example=5)

class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    value: float

class PredictionResponse(BaseModel):
    risk_score: float
    risk_category: str
    explanation: List[FeatureContribution]
    recommendation: str

# ======================
# Helper Functions
# ======================
def get_risk_category(score: float) -> str:
    if score >= 0.65:
        return "High"
    elif score >= 0.40:
        return "Medium"
    else:
        return "Low"

def get_recommendation(score: float) -> str:
    if score >= 0.65:
        return "High risk: Send multiple reminders + offer rescheduling + consider phone call."
    elif score >= 0.40:
        return "Medium risk: Send SMS + Email reminder 48 hours before."
    else:
        return "Low risk: Standard SMS reminder is enough."

# ======================
# API Endpoints
# ======================
@app.get("/")
def home():
    return {
        "message": "AI Patient No-Show Prediction System is running",
        "docs": "/docs"
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unavailable"
    return {"status": "ok", "database": db_status}

@app.post("/predict", response_model=PredictionResponse)
def predict_no_show(data: AppointmentRequest, db: Session = Depends(get_db)):
    appointment = db.get(models.Appointment, data.appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    try:
        # Convert input to DataFrame with correct column order
        input_dict = data.model_dump(exclude={"appointment_id"})
        df = pd.DataFrame([input_dict])[FEATURE_COLUMNS]

        # Predict probability
        risk_score = float(model.predict_proba(df)[0][1])

        # SHAP explanation
        shap_values = explainer.shap_values(df)[0]

        # Get top contributing features
        contributions = []
        for feature, value, shap_val in zip(FEATURE_COLUMNS, df.iloc[0], shap_values):
            contributions.append({
                "feature": feature,
                "contribution": round(float(shap_val), 4),
                "value": float(value)
            })

        # Sort by absolute contribution (most important first)
        contributions = sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True)
        top_contributions = contributions[:6]  # Top 6 features

        result = {
            "risk_score": round(risk_score, 4),
            "risk_category": get_risk_category(risk_score),
            "explanation": top_contributions,
            "recommendation": get_recommendation(risk_score)
        }

        # Persist (or update) the prediction for this appointment
        existing = (
            db.query(models.Prediction)
            .filter(models.Prediction.appointment_id == data.appointment_id)
            .first()
        )
        if existing:
            existing.risk_score = result["risk_score"]
            existing.risk_category = result["risk_category"]
            existing.explanation = {"contributions": top_contributions}
            existing.recommendation = result["recommendation"]
        else:
            db.add(models.Prediction(
                appointment_id=data.appointment_id,
                risk_score=result["risk_score"],
                risk_category=result["risk_category"],
                explanation={"contributions": top_contributions},
                recommendation=result["recommendation"],
            ))
        db.commit()

        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# Patient CRUD
# ======================
@app.post("/patients", response_model=schemas.PatientOut, status_code=201)
def create_patient(data: schemas.PatientCreate, db: Session = Depends(get_db)):
    patient = models.Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/patients", response_model=List[schemas.PatientOut])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Patient).offset(skip).limit(limit).all()


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: uuid.UUID, db: Session = Depends(get_db)):
    patient = db.get(models.Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# ======================
# Appointment CRUD
# ======================
@app.post("/appointments", response_model=schemas.AppointmentOut, status_code=201)
def create_appointment(data: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    if db.get(models.Patient, data.patient_id) is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    appointment = models.Appointment(**data.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@app.get("/appointments", response_model=List[schemas.AppointmentOut])
def list_appointments(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Appointment)
    if patient_id is not None:
        query = query.filter(models.Appointment.patient_id == patient_id)
    return query.offset(skip).limit(limit).all()


@app.get("/appointments/{appointment_id}", response_model=schemas.AppointmentOut)
def get_appointment(appointment_id: uuid.UUID, db: Session = Depends(get_db)):
    appointment = db.get(models.Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@app.patch("/appointments/{appointment_id}/outcome", response_model=schemas.AppointmentOut)
def record_appointment_outcome(
    appointment_id: uuid.UUID,
    data: schemas.AppointmentOutcomeUpdate,
    db: Session = Depends(get_db),
):
    appointment = db.get(models.Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment.no_show = data.no_show
    appointment.status = "no_show" if data.no_show else "completed"
    db.commit()
    db.refresh(appointment)
    return appointment


@app.get("/appointments/{appointment_id}/prediction", response_model=schemas.PredictionOut)
def get_appointment_prediction(appointment_id: uuid.UUID, db: Session = Depends(get_db)):
    prediction = (
        db.query(models.Prediction)
        .filter(models.Prediction.appointment_id == appointment_id)
        .first()
    )
    if prediction is None:
        raise HTTPException(status_code=404, detail="No prediction found for this appointment")
    return schemas.PredictionOut(
        id=prediction.id,
        appointment_id=prediction.appointment_id,
        risk_score=float(prediction.risk_score),
        risk_category=prediction.risk_category,
        explanation=prediction.explanation.get("contributions", []),
        recommendation=prediction.recommendation,
        created_at=prediction.created_at,
    )