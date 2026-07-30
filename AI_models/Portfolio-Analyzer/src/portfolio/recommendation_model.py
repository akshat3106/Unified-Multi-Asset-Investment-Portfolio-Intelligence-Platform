from datetime import datetime
from enum import Enum
from typing import List
from pydantic import BaseModel, Field

class ConfidenceLevel(str, Enum):
    HIGH="HIGH"
    MEDIUM="MEDIUM"
    LOW="LOW"

class RecommendationResponse(BaseModel):
    overall_summary: str = Field(
        ...,
        description="AI-generated summary of the overall portfolio.",
    )

    recommendations:List[str] = Field(
        default_factory=list, description="List of AI-generated portfolio recommendations."
    )

    disclaimer: str=Field(..., description="Regulatory disclaimer displayed with every recommendation.")

    confidence: ConfidenceLevel=Field(..., description="Confidence level of the generated recommendations.")

    generated_at:datetime=Field(..., description="Timestamp when the recommendations were generated.")