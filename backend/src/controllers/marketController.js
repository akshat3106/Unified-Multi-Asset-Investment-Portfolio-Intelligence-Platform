const marketService = require('../services/market/marketService');

// GET /api/market/search?q=reliance[&type=mutualfund]
const searchMarket = async (req, res) => {
  const { q, type } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  const quoteType = type === 'mutualfund' ? 'MUTUALFUND' : 'EQUITY';

  try {
    const results = await marketService.search(q, { quoteType });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search market', error: error.message });
  }
};

// GET /api/market/quote/:symbol
const getQuote = async (req, res) => {
  const { symbol } = req.params;

  try {
    const quote = await marketService.getQuote(symbol);
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
  }
};

// GET /api/market/chart/:symbol
const getChart = async (req, res) => {
  const { symbol } = req.params;
  const { range, interval } = req.query;

  try {
    const chart = await marketService.getChart(symbol, { range, interval });
    res.status(200).json(chart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chart', error: error.message });
  }
};

// GET /api/market/indices
const getIndices = async (req, res) => {
  try {
    const indices = await marketService.getIndices();
    res.status(200).json(indices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch indices', error: error.message });
  }
};

// GET /api/market/mutual-funds/catalog
const getMutualFundCatalog = async (req, res) => {
  try {
    const catalog = await marketService.getMutualFundCatalog();
    res.status(200).json(catalog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch mutual fund catalog', error: error.message });
  }
};

// GET /api/market/equities/catalog
const getEquityCatalog = async (req, res) => {
  try {
    const catalog = await marketService.getEquityCatalog();
    res.status(200).json(catalog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equity catalog', error: error.message });
  }
};

// GET /api/market/gold/catalog
const getGoldCatalog = async (req, res) => {
  try {
    const catalog = await marketService.getGoldCatalog();
    res.status(200).json(catalog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch gold catalog', error: error.message });
  }
};

module.exports = { searchMarket, getQuote, getChart, getIndices, getMutualFundCatalog, getEquityCatalog, getGoldCatalog };
