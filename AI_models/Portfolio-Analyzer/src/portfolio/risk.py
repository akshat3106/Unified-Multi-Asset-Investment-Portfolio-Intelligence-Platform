from .risk_models import RiskAnalysis, RiskLevel
from .analysis_model import HoldingAnalysis
from typing import List, Dict


def _calculate_concentration_risk(
        holdings_analysis: List[HoldingAnalysis],
)->RiskLevel:
    top_three=holdings_analysis[:3]
    total_percentage_allocation=0
    for holding in top_three:
        total_percentage_allocation+=holding.allocation_percentage

    if total_percentage_allocation>80:
        return RiskLevel.HIGH
    elif total_percentage_allocation>=60:
        return RiskLevel.MODERATE
    else:
        return RiskLevel.LOW


def _calculate_sector_concentration(
    holdings_analysis: List[HoldingAnalysis],
) -> Dict[str, float]:
    sector_weights: Dict[str, float] = {}
    for holding in holdings_analysis:
        sector_weights[holding.sector] = sector_weights.get(holding.sector, 0) + holding.allocation_percentage
    return {k: round(v, 2) for k, v in sector_weights.items()}


# Herfindahl-Hirschman Index (HHI)= 1 / Σ(wᵢ²)
def _calculate_effective_holdings(holding_analysis:List[HoldingAnalysis],)->float:
    hhi=0

    for holding in holding_analysis:
        weight=holding.allocation_percentage/100
        hhi+=weight**2

    if hhi == 0:
        return 0

    return 1/hhi


def _calculate_effective_asset_classes(
        holdings_analysis: List[HoldingAnalysis],
)->float:
    asset_class_weights={}

    for holdings in holdings_analysis:
        asset_type=holdings.asset_type

        if asset_type not in asset_class_weights:
            asset_class_weights[asset_type]=0

        asset_class_weights[asset_type]+= holdings.allocation_percentage

    hhi=0.0

    for allocation in asset_class_weights.values():
        weight=allocation/100
        hhi+=weight**2

    if hhi==0:
        return 0

    return 1/hhi


def _calculate_effective_sectors(
        holdings_analysis: List[HoldingAnalysis],
)->float:
    sector_weights={}

    for holdings in holdings_analysis:
        sector=holdings.sector

        if sector not in sector_weights:
            sector_weights[sector]=0

        sector_weights[sector]+= holdings.allocation_percentage

    hhi=0.0

    for allocation in sector_weights.values():
        weight=allocation/100
        hhi+=weight**2

    if hhi==0:
        return 0

    return 1/hhi


def _calculate_diversification_score(
    effective_holdings: float,
    effective_sectors: float,
    effective_asset_classes: float,
) -> int:

    holdings_score = min(effective_holdings / 10, 1) * (100 / 3)

    sector_score = min(effective_sectors / 5, 1) * (100 / 3)

    asset_class_score = min(effective_asset_classes / 4, 1) * (100 / 3)

    return round(
        holdings_score +
        sector_score +
        asset_class_score
    )
# Here 100/3=33.33 describes that the total score is equally distributed b/w holdings, sector diversification, and asset-class diversification.

# Why 10, 5 and 4?
# These are our target diversification levels. Research and portfolio management practices suggest that around 10 reasonably uncorrelated holdings provide substantial diversification benefits. Around 5 sectors provide broad industry exposure, and 4 asset classes (such as Equity, Debt, Gold, and Cash) provide good cross-asset diversification. Once these targets are reached, additional diversification provides diminishing returns, so we cap the score.


def _calculate_overall_risk(
    diversification_score: int,
    concentration_risk: RiskLevel,
) -> RiskLevel:

    if concentration_risk == RiskLevel.HIGH:
        return RiskLevel.HIGH

    if concentration_risk == RiskLevel.MODERATE:
        if diversification_score >= 75:
            return RiskLevel.MODERATE
        elif diversification_score >= 50:
            return RiskLevel.MODERATE
        else:
            return RiskLevel.HIGH

    # concentration_risk == LOW
    if diversification_score >= 75:
        return RiskLevel.LOW
    elif diversification_score >= 50:
        return RiskLevel.MODERATE
    else:
        return RiskLevel.HIGH


    # Determines the overall portfolio risk using a conservative approach.

    # Decision Priority:
    # 1. HIGH concentration always results in HIGH overall risk.
    # 2. MODERATE concentration caps the overall risk at MODERATE.
    # 3. If concentration is LOW, diversification score determines the final risk.

    # This ensures concentration risk is never masked by a high diversification score.
    


def _get_dominant_asset_class(
    holdings_analysis: List[HoldingAnalysis],
) -> tuple[str, float]:

    asset_class_weight = {}

    for holding in holdings_analysis:
        asset_class = holding.asset_type

        if asset_class not in asset_class_weight:
            asset_class_weight[asset_class] = 0

        asset_class_weight[asset_class] += holding.allocation_percentage

    if not asset_class_weight:
            return ("", 0.0)

    dominant_asset_class = max(
        asset_class_weight,
        key=asset_class_weight.get,
    )

    return (
        dominant_asset_class,
        asset_class_weight[dominant_asset_class],
    )


def _get_dominant_sector(
    holdings_analysis: List[HoldingAnalysis],
) -> tuple[str, float]:

    sector_weights = {}

    for holding in holdings_analysis:
        sector = holding.sector

        if sector not in sector_weights:
            sector_weights[sector] = 0

        sector_weights[sector] += holding.allocation_percentage

    if not sector_weights:
            return ("", 0.0)

    dominant_sector = max(
        sector_weights,
        key=sector_weights.get,
    )

    return (
        dominant_sector,
        sector_weights[dominant_sector],
    ) 


def _generate_warnings(
    holdings_analysis: List[HoldingAnalysis],
    concentration_risk: RiskLevel,
    diversification_score: int,
) -> List[str]:

    warnings = []

    dominant_sector, sector_percentage = _get_dominant_sector(
        holdings_analysis
    )

    dominant_asset_class, asset_class_percentage = (
        _get_dominant_asset_class(holdings_analysis)
    )

    # Concentration Risk
    if concentration_risk == RiskLevel.HIGH:
        warnings.append(
            "Your portfolio is highly concentrated in a few holdings. "
            "Consider spreading your investments across more holdings."
        )

    elif concentration_risk == RiskLevel.MODERATE:
        warnings.append(
            "Your portfolio has moderate concentration risk. "
            "Further diversification may help reduce risk."
        )

    # Overall Diversification
    if diversification_score < 50:
        warnings.append(
            "Your portfolio has low diversification across holdings, "
            "sectors and asset classes."
        )

    elif diversification_score < 75:
        warnings.append(
            "Your portfolio is moderately diversified. "
            "There is still room to improve diversification."
        )

    # Sector Concentration
    if sector_percentage >= 60:
        warnings.append(
            f"{sector_percentage:.1f}% of your portfolio is invested in the "
            f"{dominant_sector} sector, increasing sector-specific risk."
        )

    # Asset Class Concentration
    if asset_class_percentage >= 80:
        warnings.append(
            f"{asset_class_percentage:.1f}% of your portfolio is invested in "
            f"{dominant_asset_class.value}, limiting asset-class diversification."
        )

    return warnings

    

def analyze_risk(holdings_analysis:List[HoldingAnalysis],)->RiskAnalysis:
    effective_holdings = _calculate_effective_holdings(
        holdings_analysis
    )

    effective_sectors = _calculate_effective_sectors(
        holdings_analysis
    )

    effective_asset_classes = _calculate_effective_asset_classes(
        holdings_analysis
    )

    diversification_score = _calculate_diversification_score(
    effective_holdings,
    effective_sectors,
    effective_asset_classes,
    )

    concentration_risk = _calculate_concentration_risk(
    holdings_analysis   
    )   

    overall_risk=_calculate_overall_risk(
        diversification_score,
        concentration_risk,
    )

    warnings = _generate_warnings(
    holdings_analysis,
    concentration_risk,
    diversification_score,
    )

    sector_concentration=_calculate_sector_concentration(
        holdings_analysis
    )

    return RiskAnalysis(
    overall_risk=overall_risk,
    diversification_score=diversification_score,
    concentration_risk=concentration_risk,
    sector_concentration=sector_concentration, 
    warnings=warnings,
    )