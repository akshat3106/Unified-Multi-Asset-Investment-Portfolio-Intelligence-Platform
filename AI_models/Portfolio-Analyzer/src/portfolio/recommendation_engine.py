from datetime import datetime

from .analysis_model import PortfolioAnalysis
from .llm import generate_recommendations_from_llm
from .models import PortfolioRequest
from .prompts import build_recommendation_prompt
from .recommendation_model import (
    ConfidenceLevel,
    RecommendationResponse,
)
from .risk_models import RiskAnalysis
from .guardrails import validate_recommendation_output, sanitize_text


def _calculate_confidence(
    portfolio_analysis: PortfolioAnalysis,
) -> ConfidenceLevel:
    if portfolio_analysis.total_holdings >= 10:
        return ConfidenceLevel.HIGH
    elif portfolio_analysis.total_holdings >= 5:
        return ConfidenceLevel.MEDIUM
    else:
        return ConfidenceLevel.LOW


def generate_recommendations(
    portfolio: PortfolioRequest,
    portfolio_analysis: PortfolioAnalysis,
    risk_analysis: RiskAnalysis,
) -> RecommendationResponse:
    try:
        prompt = build_recommendation_prompt(
            portfolio,
            portfolio_analysis,
            risk_analysis,
        )

        llm_response = generate_recommendations_from_llm(
            prompt
        )

        overall_summary = llm_response.get("overall_summary", "")
        recommendations = llm_response.get("recommendations", [])

        validation_result = validate_recommendation_output(overall_summary, recommendations)

        if validation_result["is_safe"] == False:
            overall_summary = sanitize_text(overall_summary)
            new_recommendations = []
            for rec in recommendations:
                new_recommendations.append(sanitize_text(rec))
            recommendations = new_recommendations

        return RecommendationResponse(
            overall_summary=overall_summary,
            recommendations=recommendations,
            disclaimer=(
                "These insights are generated for educational purposes only "
                "and should not be considered financial or investment advice. "
                "Please consult a SEBI-registered investment adviser before "
                "making investment decisions."
            ),
            confidence=_calculate_confidence(
                portfolio_analysis
            ),
            generated_at=datetime.now(),
        )

    except Exception as e:
        raise RuntimeError(
            f"Failed to generate recommendations: {e}"
        )