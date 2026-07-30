# file with actual business logic.
from .models import Holding, PortfolioRequest
from typing import List
from .analysis_model import HoldingAnalysis, PortfolioAnalysis

def _calculate_current_value(holdings:List[Holding]) -> None:
    for holding in holdings:
        if holding.current_value is None:
            holding.current_value=(holding.quantity*holding.current_price)


def _calculate_total_portfolio_value(holdings:List[Holding]) -> float:
    total_value=0
    for holding in holdings:
        total_value+=holding.current_value

    return total_value


def _calculate_allocation_percentage(holdings:List[Holding], total_portfolio_value: float)-> List[HoldingAnalysis]:
    holding_analysis_list=[]

    if total_portfolio_value == 0:
                raise ValueError("Total portfolio value is zero; cannot compute allocations.")
    
    for holding in holdings:
        allocation_percentage=(holding.current_value/total_portfolio_value)*100

        analysis = HoldingAnalysis(
            asset_name=holding.asset_name,
            asset_type=holding.asset_type,
            sector=holding.sector,
            current_value=holding.current_value,
            allocation_percentage=allocation_percentage,
        )

        holding_analysis_list.append(analysis)

    holding_analysis_list.sort(
    key=lambda x: x.allocation_percentage,
    reverse=True,)

    return holding_analysis_list


def _find_largest_holding(
    holdings_analysis: List[HoldingAnalysis],
) -> HoldingAnalysis:

    if not holdings_analysis:
        raise ValueError("Portfolio contains no holdings.")

    return holdings_analysis[0]


def analyze_portfolio(portfolio: PortfolioRequest,)->PortfolioAnalysis:
    
    _calculate_current_value(portfolio.holdings)

    total_portfolio_value=_calculate_total_portfolio_value(portfolio.holdings)

    holdings_analysis=_calculate_allocation_percentage(
        portfolio.holdings,
        total_portfolio_value
    )

    largest_holding=_find_largest_holding(holdings_analysis)

    return PortfolioAnalysis(
        total_portfolio_value = total_portfolio_value,
        total_holdings = len(portfolio.holdings),
        largest_holding = largest_holding.asset_name,
        largest_holding_value = largest_holding.current_value,
        largest_holding_percentage = largest_holding.allocation_percentage,
        holdings_analysis = holdings_analysis,
    )