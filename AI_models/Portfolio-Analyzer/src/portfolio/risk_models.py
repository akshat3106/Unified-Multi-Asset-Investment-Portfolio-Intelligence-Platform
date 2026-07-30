# contains RiskLevel Enum and Risk Analysis Pydantic model
from pydantic import BaseModel, Field
from typing import Dict,List
from enum import Enum
class RiskLevel(Enum):
    LOW="Low"
    MODERATE="Moderate"
    HIGH="High"

class RiskAnalysis(BaseModel):
    overall_risk:RiskLevel = Field(...,description="Overall Portfolio Risk.")

    diversification_score: float = Field(..., ge=0, le=100, description="Portfolio diversification score.")

    concentration_risk: RiskLevel=Field(..., description="Risk due to concentration in a few assets.")

    sector_concentration: Dict[str, float]= Field(..., description="Percentage allocation across sectors.")

    warnings: List[str]=Field(default_factory=list, description="List of risk warnings generated during analysis.")