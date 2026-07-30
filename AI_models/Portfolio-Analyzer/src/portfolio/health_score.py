from .risk_models import RiskAnalysis, RiskLevel

def calculate_health_score(risk_analysis: RiskAnalysis)->int:
    score=risk_analysis.diversification_score

    if risk_analysis.overall_risk==RiskLevel.HIGH:
        score=score-20
    elif risk_analysis.overall_risk==RiskLevel.MODERATE:
        score=score-10

    if risk_analysis.concentration_risk==RiskLevel.HIGH:
        score=score-15
    elif risk_analysis.concentration_risk==RiskLevel.MODERATE:
        score=score-5

    if score<0:
        score=0
    if score>100:
        score=100

    return round(score)

def get_health_label(score:int)->str:
    if score>=75:
        return "Good"
    elif score>=50:
        return "Needs Improvement"
    else:
        return "Poor"
    