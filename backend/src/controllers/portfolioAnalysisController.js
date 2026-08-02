const PORTFOLIO_ANALYZER_URL = process.env.PORTFOLIO_ANALYZER_URL || 'http://localhost:8002';

async function analyzePortfolio(req, res) {
  try {
    const response = await fetch(`${PORTFOLIO_ANALYZER_URL}/analyze-portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    return res.status(503).json({ message: 'Portfolio Analyzer is unavailable' });
  }
}

module.exports = { analyzePortfolio };
