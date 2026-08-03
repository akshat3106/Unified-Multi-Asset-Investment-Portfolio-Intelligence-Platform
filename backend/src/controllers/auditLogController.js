const PortfolioAuditLog = require('../models/PortfolioAuditLog');

async function getAuditLog(req, res) {
  const { userId } = req.query;

  try {
    const filter = userId ? { userId } : {};
    const docs = await PortfolioAuditLog.find(filter).sort({ timestamp: 1 }).lean();

    const entries = docs.map((doc) => ({
      timestamp: doc.timestamp,
      user_id: doc.userId,
      session_id: doc.sessionId,
      analyzer_version: doc.analyzerVersion,
      response_hash: doc.responseHash,
      request: doc.request,
      response: doc.response,
    }));

    return res.json({ count: entries.length, entries });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load audit log' });
  }
}

module.exports = { getAuditLog };
