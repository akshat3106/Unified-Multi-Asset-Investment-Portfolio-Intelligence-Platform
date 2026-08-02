# main.py (at project root, outside src/)
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder

from src.portfolio.models import PortfolioRequest
from src.portfolio.analyzer import analyze_portfolio
from src.portfolio.risk import analyze_risk
from src.portfolio.recommendation_engine import generate_recommendations
from src.portfolio.health_score import calculate_health_score, get_health_label
from src.portfolio.audit_log import save_audit_entry,read_audit_log

app = FastAPI(
    title="AI Portfolio Analyzer",
    description="Educational portfolio analysis and diversification insights.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/audit-log")
def get_audit_log(user_id: str = None):
    entries = read_audit_log(user_id)
    return {
        "count": len(entries),
        "entries": entries,
    }

@app.post("/analyze-portfolio")
def analyze(request: PortfolioRequest):
    try:
        portfolio_analysis = analyze_portfolio(request)
        risk_analysis = analyze_risk(portfolio_analysis.holdings_analysis)
        recommendations = generate_recommendations(
            request, portfolio_analysis, risk_analysis
        )
        health_score=calculate_health_score(risk_analysis)
        health_label=get_health_label(health_score)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    response_data = {
        "user_id": request.user_id,
        "session_id": request.session_id,
        "portfolio_analysis": portfolio_analysis,
        "risk_analysis": risk_analysis,
        "health_score": health_score,
        "health_label": health_label,
        "recommendations": recommendations,
    }

    save_audit_entry(
        user_id=request.user_id,
        session_id=request.session_id,
        request_data=request.model_dump(),
        response_data=jsonable_encoder(response_data),
    )

    return response_data