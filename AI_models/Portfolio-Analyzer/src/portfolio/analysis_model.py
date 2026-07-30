from typing import List
from pydantic import BaseModel, Field
from .models import AssetType

class HoldingAnalysis(BaseModel):
    asset_name: str=Field(..., description="Name of the asset")

    asset_type: AssetType = Field(..., description="Type of investment asset")

    sector: str= Field(..., description="Sector of the asset")

    current_value: float= Field(..., ge=0, description="Curret market value of the holding")

    allocation_percentage: float = Field(..., ge=0, le=100, description="Percentage allocation in the portfolio")


class PortfolioAnalysis(BaseModel):
    total_portfolio_value: float = Field(
        ..., ge=0, description="Total current value of the portfolio"
    )

    total_holdings: int =Field(..., ge=0, description="Total number of holdings")

    largest_holding: str=Field(
        ..., description="Name of the largest holdings"
    )

    largest_holding_value: float = Field(..., ge=0, description="Current value of the largest holding")

    largest_holding_percentage: float = Field(..., ge=0, le=100, description="Allocation percentage of the largest holding")

    holdings_analysis: List[HoldingAnalysis]= Field(..., description="Analysis of individual holdings")