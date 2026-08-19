from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
import pickle
import os

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
# Request & Response Models
# ======================
class AppointmentRequest(BaseModel):
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

@app.post("/predict", response_model=PredictionResponse)
def predict_no_show(data: AppointmentRequest):
    try:
        # Convert input to DataFrame with correct column order
        input_dict = data.model_dump()
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

        return {
            "risk_score": round(risk_score, 4),
            "risk_category": get_risk_category(risk_score),
            "explanation": contributions[:6],  # Top 6 features
            "recommendation": get_recommendation(risk_score)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))