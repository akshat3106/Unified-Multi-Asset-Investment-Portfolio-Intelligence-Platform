const mongoose = require('mongoose');

// Persistent, append-only trail of every portfolio analysis request/response,
// for regulatory transparency. Stored in MongoDB Atlas rather than a local
// file so entries survive service restarts and redeploys.
const portfolioAuditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    sessionId: { type: String },
    analyzerVersion: { type: String },
    responseHash: { type: String },
    request: { type: mongoose.Schema.Types.Mixed },
    response: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('PortfolioAuditLog', portfolioAuditLogSchema);
