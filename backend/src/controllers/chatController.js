const FINANCE_BOT_URL = process.env.FINANCE_BOT_URL || 'http://localhost:8001';

function getFallbackReply(query) {
  const q = query.toLowerCase();
  if (q.includes('sip') || q.includes('systematic')) {
    return "A **Systematic Investment Plan (SIP)** allows you to invest a fixed amount regularly into mutual funds. It promotes disciplined investing, leverages rupee cost averaging, and harnesses compound interest over time.";
  }
  if (q.includes('rebalanc') || q.includes('allocation')) {
    return "Portfolio rebalancing involves adjusting your asset weights (stocks, mutual funds, gold, FDs) back to your target risk profile. For example, if equity gains push your allocation above your target (e.g. 50%), selling equity or adding debt restores your risk balance.";
  }
  if (q.includes('risk') || q.includes('profile')) {
    return "Your risk profile determines how your capital is divided among growth (equities/mutual funds), stability (fixed deposits/debt), and hedges (digital gold/SGBs). Retake the Risk Quiz in your Profile tab to update your asset target.";
  }
  if (q.includes('nifty') || q.includes('sensex') || q.includes('market') || q.includes('stock')) {
    return "Live Indian market indices (NIFTY 50, SENSEX, NIFTY BANK) update on your Dashboard top ticker. You can search any stock or mutual fund scheme via the search bar above to inspect real-time quotes, charts, and key performance metrics.";
  }
  return `Thank you for your question about "${query}". AssetBridge Finance Buddy is here to help! For portfolio management, you can track your total value, set financial goals, inspect asset distribution, or consult live market quotes using the navigation bar.`;
}

async function sendMessage(req, res) {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'message is required' });
  }

  try {
    const botResponse = await fetch(`${FINANCE_BOT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId || 'default',
        message,
      }),
    });

    if (!botResponse.ok) {
      throw new Error(`Bot service status: ${botResponse.status}`);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const contentType = botResponse.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await botResponse.json();
      res.write(data.answer || data.reply || data.message || '');
      return res.end();
    }

    const reader = botResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.write(getFallbackReply(message));
      return res.end();
    }
    return res.end();
  }
}

module.exports = { sendMessage };
