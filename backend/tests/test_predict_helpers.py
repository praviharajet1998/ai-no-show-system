from app.main import get_recommendation, get_risk_category


def test_risk_category_thresholds():
    assert get_risk_category(0.0) == "Low"
    assert get_risk_category(0.39) == "Low"
    assert get_risk_category(0.40) == "Medium"
    assert get_risk_category(0.64) == "Medium"
    assert get_risk_category(0.65) == "High"
    assert get_risk_category(1.0) == "High"


def test_recommendation_matches_category():
    assert "Standard SMS" in get_recommendation(0.1)
    assert "SMS + Email" in get_recommendation(0.5)
    assert "multiple reminders" in get_recommendation(0.9)
