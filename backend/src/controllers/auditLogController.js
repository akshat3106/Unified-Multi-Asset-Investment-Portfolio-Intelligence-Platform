const PORTFOLIO_ANALYZER_URL = process.env.PORTFOLIO_ANALYZER_URL || 'http://localhost:8002';

async function getAuditLog(req, res) {
  const { userId } = req.query;

  try {
    const url = new URL('/audit-log', PORTFOLIO_ANALYZER_URL);
    if (userId) url.searchParams.set('user_id', userId);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ message: 'Portfolio Analyzer audit log request failed' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(503).json({ message: 'Portfolio Analyzer is unavailable' });
  }
}

module.exports = { getAuditLog };
