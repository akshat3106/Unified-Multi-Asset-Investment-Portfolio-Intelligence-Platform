const yahooProvider = require('./providers/yahooProvider');

const provider = yahooProvider;

const search = (query, options) => provider.search(query, options);
const getQuote = (symbol) => provider.getQuote(symbol);
const getChart = (symbol, options) => provider.getChart(symbol, options);
const getIndices = () => provider.getIndices();
const getMutualFundCatalog = () => provider.getMutualFundCatalog();
const getEquityCatalog = () => provider.getEquityCatalog();
const getGoldCatalog = () => provider.getGoldCatalog();

module.exports = {
  search,
  getQuote,
  getChart,
  getIndices,
  getMutualFundCatalog,
  getEquityCatalog,
  getGoldCatalog,
};
