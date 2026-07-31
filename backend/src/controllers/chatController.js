const FINANCE_BOT_URL = process.env.FINANCE_BOT_URL || 'http://localhost:8001';

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
      return res.status(502).json({ message: 'Finance education bot request failed' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const contentType = botResponse.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await botResponse.json();
      res.write(data.answer);
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
      return res.status(503).json({ message: 'Finance education bot is unavailable' });
    }
    return res.end();
  }
}

module.exports = { sendMessage };
