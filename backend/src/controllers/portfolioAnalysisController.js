const crypto = require('crypto');
const PortfolioAuditLog = require('../models/PortfolioAuditLog');

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

    // Persist the audit trail in MongoDB (not the analyzer's local disk) so
    // it survives restarts/redeploys of the Portfolio Analyzer service.
    try {
      const responseHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
      await PortfolioAuditLog.create({
        userId: data.user_id ?? req.body.user_id,
        sessionId: data.session_id ?? req.body.session_id,
        analyzerVersion: data.analyzer_version,
        responseHash,
        request: req.body,
        response: data,
      });
    } catch (auditError) {
      console.error(`Failed to persist portfolio audit log entry: ${auditError.message}`);
    }

    return res.json(data);
  } catch (error) {
    return res.status(503).json({ message: 'Portfolio Analyzer is unavailable' });
  }
}

module.exports = { analyzePortfolio };
