const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const INDEX_SYMBOLS = {
  NIFTY_50: '^NSEI',
  SENSEX: '^BSESN',
  BANK_NIFTY: '^NSEBANK',
};

// Financial Modeling Prep serves a logo by ticker directly (no name/domain guessing
// needed) at this public image endpoint. Unknown tickers return a text/html "Symbol
// Image not found" body instead of a 404, which the frontend's <img onerror> still
// catches correctly since it's invalid image data, not a network failure.
const getLogoUrl = (symbol) => `https://financialmodelingprep.com/image-stock/${symbol}.png`;

// Yahoo's search mixes commodity futures, mutual fund scheme codes, and equities
// all together for a given query — quoteType is what actually distinguishes them.
// Defaults to EQUITY (plain stock search); pass quoteType: 'MUTUALFUND' for funds.
const search = async (query, { quoteType = 'EQUITY' } = {}) => {
  const result = await yahooFinance.search(query);
  return result.quotes
    .filter((q) => q.symbol && q.isYahooFinance !== false && q.quoteType === quoteType)
    .map((q) => ({
      // Indian mutual fund scheme codes often have no shortname — longname carries
      // the actual human-readable fund name in that case (e.g. "0P0001RK6V.BO" vs
      // "HDFC Pharma and Healthcare Reg IDCW-P").
      symbol: q.symbol,
      name: q.longname || q.shortname || q.symbol,
      exchange: q.exchange,
      type: q.quoteType,
      logoUrl: getLogoUrl(q.symbol),
    }));
};

const getQuote = async (symbol) => {
  const quote = await yahooFinance.quote(symbol);
  return {
    symbol: quote.symbol,
    name: quote.longName || quote.shortName || quote.symbol,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    dayHigh: quote.regularMarketDayHigh,
    dayLow: quote.regularMarketDayLow,
    previousClose: quote.regularMarketPreviousClose,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    currency: quote.currency,
    exchange: quote.fullExchangeName,
    marketState: quote.marketState,
    // Mutual funds don't have volume/marketCap, but do have these return metrics —
    // undefined for regular equities, populated for MUTUALFUND quotes.
    ytdReturn: quote.ytdReturn,
    threeMonthReturn: quote.trailingThreeMonthReturns,
    logoUrl: getLogoUrl(quote.symbol),
  };
};

const RANGE_TO_MS = {
  '1d': 24 * 60 * 60 * 1000,
  '5d': 5 * 24 * 60 * 60 * 1000,
  '1mo': 31 * 24 * 60 * 60 * 1000,
  '3mo': 93 * 24 * 60 * 60 * 1000,
  '6mo': 186 * 24 * 60 * 60 * 1000,
  '1y': 366 * 24 * 60 * 60 * 1000,
  '5y': 5 * 366 * 24 * 60 * 60 * 1000,
  max: 40 * 366 * 24 * 60 * 60 * 1000,
};

const getChart = async (symbol, { range = '1mo', interval = '1d' } = {}) => {
  const period2 = new Date();
  const period1 = new Date(period2.getTime() - (RANGE_TO_MS[range] || RANGE_TO_MS['1mo']));

  const result = await yahooFinance.chart(symbol, { period1, period2, interval });
  return {
    symbol,
    currency: result.meta.currency,
    range,
    interval,
    candles: result.quotes.map((q) => ({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    })),
  };
};

const getIndices = async () => {
  const symbols = Object.values(INDEX_SYMBOLS);
  const quotes = await Promise.all(symbols.map((symbol) => yahooFinance.quote(symbol)));

  return quotes.map((quote) => ({
    symbol: quote.symbol,
    name: quote.shortName || quote.longName || quote.symbol,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
  }));
};

module.exports = { search, getQuote, getChart, getIndices };
