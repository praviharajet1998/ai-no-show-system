import pandas as pd
import pickle
import shap
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

print("Loading data...")
X = pd.read_csv("data/X.csv")
y = pd.read_csv("data/y.csv").squeeze()

print(f"Data shape: {X.shape}")
print(f"No-show rate: {y.mean():.2%}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    random_state=42,
    eval_metric='auc'
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\n=== Model Performance ===")
print(f"Accuracy : {accuracy_score(y_test, y_pred):.4f}")
print(f"AUC      : {roc_auc_score(y_test, y_proba):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Save model
pickle.dump(model, open("models/xgboost_model.pkl", "wb"))
print("\n✅ Model saved: models/xgboost_model.pkl")

# Create and save SHAP explainer
print("Creating SHAP explainer (this may take a few seconds)...")
explainer = shap.TreeExplainer(model)
pickle.dump(explainer, open("models/shap_explainer.pkl", "wb"))
print("✅ SHAP explainer saved: models/shap_explainer.pkl")

print("\nAll done! Model and SHAP are ready.")
