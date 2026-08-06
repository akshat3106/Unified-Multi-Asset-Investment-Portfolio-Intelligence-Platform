const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Yahoo's unofficial API aggressively rate-limits (429 "Failed to get crumb")
// when many quote requests fire concurrently from a shared/datacenter IP
// (e.g. Render, Vercel functions). Caching short-lived results and running
// requests through a small concurrency-limited queue keeps us well under
// that threshold instead of bursting 9+ requests at once.
const QUOTE_CACHE_TTL_MS = 60 * 1000;
const quoteCache = new Map(); // symbol -> { data, expiresAt }

const cachedQuote = async (symbol) => {
  const cached = quoteCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const data = await yahooFinance.quote(symbol);
  quoteCache.set(symbol, { data, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS });
  return data;
};

// Runs async tasks with at most `limit` in flight at once, instead of firing
// every request in parallel (which is what triggers Yahoo's rate limiting).
const runWithConcurrencyLimit = async (items, limit, task) => {
  const results = new Array(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await Promise.allSettled([task(items[index])]).then(([r]) => r);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

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
  const quote = await cachedQuote(symbol);
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
  const results = await runWithConcurrencyLimit(symbols, 3, cachedQuote);
  const quotes = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);

  return quotes.map((quote) => ({
    symbol: quote.symbol,
    name: quote.shortName || quote.longName || quote.symbol,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
  }));
};

// Curated flagship Indian mutual fund search terms — Yahoo's Indian MF search
// coverage is inconsistent (many well-known schemes don't resolve at all, and
// longer/more specific queries tend to return zero results), so this list was
// hand-verified to actually return a recognizable, real fund for each entry.
const MUTUAL_FUND_CATALOG_QUERIES = [
  'HDFC Nifty 50',
  'UTI Nifty 50',
  'Mirae Asset Large Cap',
  'Axis Midcap',
  'Nippon India Small Cap',
  'HSBC Small Cap',
  'DSP Small Cap',
  'ICICI Prudential Bluechip',
];

const getMutualFundCatalog = async () => {
  const searchResults = await Promise.allSettled(
    MUTUAL_FUND_CATALOG_QUERIES.map(async (query) => {
      const result = await yahooFinance.search(query);
      const match = result.quotes.find((q) => q.quoteType === 'MUTUALFUND' && q.exchange === 'BSE');
      if (!match) return null;
      return match.symbol;
    })
  );

  const symbols = searchResults
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  const quoteResults = await runWithConcurrencyLimit(symbols, 3, cachedQuote);

  return quoteResults
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => {
      const quote = r.value;
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.symbol,
        exchange: quote.fullExchangeName || 'BSE',
        price: quote.regularMarketPrice,
        currency: quote.currency,
        ytdReturn: quote.ytdReturn,
        threeMonthReturn: quote.trailingThreeMonthReturns,
        logoUrl: getLogoUrl(quote.symbol),
      };
    });
};

// Fetches quotes for a fixed symbol list in parallel, silently dropping any
// symbol that fails to resolve (delisted, renamed, wrong suffix, etc.).
const getQuoteCatalog = async (symbols, typeLabel) => {
  const quoteResults = await runWithConcurrencyLimit(symbols, 3, cachedQuote);

  return quoteResults
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => {
      const quote = r.value;
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        exchange: quote.fullExchangeName || 'NSE',
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
        type: typeLabel,
        logoUrl: getLogoUrl(quote.symbol),
      };
    });
};

// Curated large-cap NSE stocks for the Invest > Equities default browse view.
const EQUITY_CATALOG_SYMBOLS = [
  'RELIANCE.NS',
  'TCS.NS',
  'INFY.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'BHARTIARTL.NS',
  'ITC.NS',
  'LT.NS',
  'SBIN.NS',
];

const getEquityCatalog = () => getQuoteCatalog(EQUITY_CATALOG_SYMBOLS, 'EQUITY');

// Curated Gold ETFs (real, exchange-traded proxies for digital gold pricing —
// there is no single "digital gold" ticker; ETFs are the closest tradeable
// real-market instrument backed by physical gold).
const GOLD_CATALOG_SYMBOLS = [
  'GOLDBEES.NS',
  'GOLD1.NS',
  'GOLDIETF.NS',
  'HDFCGOLD.NS',
  'SETFGOLD.NS',
];

const getGoldCatalog = () => getQuoteCatalog(GOLD_CATALOG_SYMBOLS, 'GOLD ETF');

module.exports = {
  search,
  getQuote,
  getChart,
  getIndices,
  getMutualFundCatalog,
  getEquityCatalog,
  getGoldCatalog,
};
