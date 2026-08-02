const User = require('../models/User');
const Holding = require('../models/Holding');
const marketService = require('../services/market/marketService');

const shortNameFromSymbol = (symbol) => symbol.split('.')[0].slice(0, 6).toUpperCase();

// Yahoo range/interval per frontend timeframe button. Longer ranges use a
// coarser interval so we don't pull years of daily candles per holding.
const PERFORMANCE_RANGE_CONFIG = {
  '1w': { range: '5d', interval: '1d' },
  '1m': { range: '1mo', interval: '1d' },
  '3m': { range: '3mo', interval: '1d' },
  '1y': { range: '1y', interval: '1wk' },
  all: { range: '5y', interval: '1mo' },
};

const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

// GET /api/v1/portfolio/holdings
// Returns the logged-in user's holdings with live prices joined in from
// Yahoo Finance — quantity/avgBuyPrice are the only things actually stored.
const getHoldings = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const holdings = await Holding.find({ user: user._id });

    const enriched = await Promise.allSettled(
      holdings.map(async (h) => {
        const quote = await marketService.getQuote(h.symbol);
        const currentPrice = quote.price ?? h.avgBuyPrice;
        const currentValue = Number((h.quantity * currentPrice).toFixed(2));
        const invested = Number((h.quantity * h.avgBuyPrice).toFixed(2));
        const returnPct = invested > 0 ? Number((((currentValue - invested) / invested) * 100).toFixed(2)) : 0;

        return {
          id: h._id.toString(),
          symbol: h.symbol,
          name: h.name,
          shortName: shortNameFromSymbol(h.symbol),
          category: h.category,
          subCategory: h.category,
          invested,
          currentValue,
          units: h.quantity,
          returnPct,
          logoUrl: quote.logoUrl,
        };
      })
    );

    const result = enriched
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch holdings', error: error.message });
  }
};

// GET /api/v1/portfolio/performance?range=1w|1m|3m|1y|all
// Reconstructs REAL historical portfolio value by summing each holding's
// quantity against that instrument's actual historical close price from
// Yahoo Finance — there's no stored daily snapshot of the user's portfolio,
// so this is computed on the fly instead of being fabricated.
const getPerformance = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const filter = { user: user._id };
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const holdings = await Holding.find(filter);
    if (holdings.length === 0) {
      return res.status(200).json({ labels: [], data: [] });
    }

    const { range, interval } = PERFORMANCE_RANGE_CONFIG[req.query.range] || PERFORMANCE_RANGE_CONFIG['3m'];

    const chartResults = await Promise.allSettled(
      holdings.map((h) => marketService.getChart(h.symbol, { range, interval }))
    );

    const holdingSeries = [];
    chartResults.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      const series = new Map();
      r.value.candles.forEach((c) => {
        if (c.close != null) series.set(dateKey(c.date), c.close);
      });
      if (series.size > 0) {
        holdingSeries.push({ quantity: holdings[i].quantity, series });
      }
    });

    if (holdingSeries.length === 0) {
      return res.status(200).json({ labels: [], data: [] });
    }

    const allDatesSet = new Set();
    holdingSeries.forEach(({ series }) => {
      for (const d of series.keys()) allDatesSet.add(d);
    });

    // Trim to the range where every holding actually has data. Without this,
    // a holding whose price history starts later than the others (or that
    // simply has fewer data points in this window) is silently absent from
    // the earliest dates, understating total value and producing an
    // artificial vertical jump once that holding's data "kicks in".
    const latestFirstDate = holdingSeries
      .map(({ series }) => Array.from(series.keys()).sort()[0])
      .reduce((latest, d) => (d > latest ? d : latest));

    const allDates = Array.from(allDatesSet)
      .filter((d) => d >= latestFirstDate)
      .sort();

    // Sum quantity*price per date, forward-filling a holding's last known
    // price on days its own series is missing a data point (e.g. a
    // stock-exchange holiday that doesn't line up across every symbol).
    // Pre-seed each holding's carry-forward price from its last close at or
    // before the trim point, so the very first displayed date is already
    // correctly filled for holdings whose data starts earlier than others.
    const lastKnownPrice = new Map();
    holdingSeries.forEach(({ series }, idx) => {
      const priorDates = Array.from(series.keys()).filter((d) => d < latestFirstDate).sort();
      if (priorDates.length > 0) {
        lastKnownPrice.set(idx, series.get(priorDates[priorDates.length - 1]));
      }
    });

    const data = allDates.map((date) => {
      let total = 0;
      holdingSeries.forEach((h, idx) => {
        let price = h.series.get(date);
        if (price == null) {
          price = lastKnownPrice.get(idx);
        } else {
          lastKnownPrice.set(idx, price);
        }
        if (price != null) total += h.quantity * price;
      });
      return Number(total.toFixed(2));
    });

    const labels = allDates.map((d) =>
      new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    );

    res.status(200).json({ labels, data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch performance', error: error.message });
  }
};

module.exports = { getHoldings, getPerformance };
