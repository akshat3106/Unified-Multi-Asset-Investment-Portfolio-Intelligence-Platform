# This file will contain AssetType Enum, Holding Pydantic Model, PortfolioRequest Pydantic Model

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class AssetType(str,Enum):
    EQUITY="Equity"
    MUTUAL_FUND="Mutual Fund"
    ETF="ETF"
    GOLD="Gold"
    BOND="Bond"
    CASH="Cash"
    REIT="REIT"
    INVIT="InvIT"

class Holding(BaseModel):
    asset_name:str=Field(..., description="Name of the asset")

    asset_type:AssetType = Field(..., description="Type of investment asset")

    sector:str = Field(..., description="Sector to which the asset belongs")

    quantity:float = Field(..., gt=0, description="Number of units/shares owned")

    avg_buy_price:float = Field(..., ge=0, description="Average purchase price per unit")

    current_price: float =Field(..., ge=0, description="Current market price per unit")

    current_value:Optional[float]=Field(
        default=None,
        ge=0,
        description="Current total value of holding. calculated if not provided."
    )

class PortfolioRequest(BaseModel):
    user_id:str =Field(..., description="Unique user identifier")

    session_id: str=Field(
        ..., description="Session identifier for tracking analysis"
    )

    holdings:List[Holding]=Field(
        ..., min_length=1, description="List of all portfolio holdings"
    )