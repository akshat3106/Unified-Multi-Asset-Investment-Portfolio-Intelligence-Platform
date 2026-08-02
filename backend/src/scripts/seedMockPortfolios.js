// One-off seed script — NOT run automatically by the server.
// Builds 10 realistic mock portfolios from real Yahoo Finance instruments
// (equities, mutual funds, gold ETFs) and stores them as MockPortfolioTemplate
// documents. Run manually: node src/scripts/seedMockPortfolios.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const marketService = require('../services/market/marketService');
const MockPortfolioTemplate = require('../models/MockPortfolioTemplate');

const TEMPLATE_COUNT = 10;
const MIN_HOLDINGS_PER_TEMPLATE = 5;
const MAX_HOLDINGS_PER_TEMPLATE = 8;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pickRandomSubset(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Realistic per-category ranges for quantity and how far the mock "buy price"
// sits from today's real price (so some holdings show gains, some losses).
function buildHoldingFromInstrument(instrument) {
  const quantityRanges = {
    equity: [5, 60],
    mf: [50, 1200],
    gold: [5, 80],
  };

  const [minQty, maxQty] = quantityRanges[instrument.category];
  const quantity = Number(randomFloat(minQty, maxQty).toFixed(2));
  const buyPriceFactor = randomFloat(0.65, 1.35);
  const avgBuyPrice = Number((instrument.price * buyPriceFactor).toFixed(2));

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    category: instrument.category,
    exchange: instrument.exchange,
    quantity,
    avgBuyPrice,
  };
}

async function main() {
  await connectDB();

  console.log('Fetching real instrument data from Yahoo Finance...');
  const [equities, mutualFunds, gold] = await Promise.all([
    marketService.getEquityCatalog(),
    marketService.getMutualFundCatalog(),
    marketService.getGoldCatalog(),
  ]);

  const pool = [
    ...equities.map((e) => ({ ...e, category: 'equity' })),
    ...mutualFunds.map((f) => ({ ...f, category: 'mf' })),
    ...gold.map((g) => ({ ...g, category: 'gold' })),
  ];

  console.log(`Instrument pool: ${equities.length} equities, ${mutualFunds.length} mutual funds, ${gold.length} gold ETFs (${pool.length} total).`);

  if (pool.length < MIN_HOLDINGS_PER_TEMPLATE) {
    throw new Error('Not enough live instruments resolved to build portfolios — check Yahoo Finance connectivity.');
  }

  const templates = [];
  for (let i = 0; i < TEMPLATE_COUNT; i++) {
    const holdingCount = Math.min(randomInt(MIN_HOLDINGS_PER_TEMPLATE, MAX_HOLDINGS_PER_TEMPLATE), pool.length);
    const chosen = pickRandomSubset(pool, holdingCount);
    const holdings = chosen.map(buildHoldingFromInstrument);
    templates.push({ index: i, holdings });
  }

  for (const template of templates) {
    await MockPortfolioTemplate.findOneAndUpdate(
      { index: template.index },
      template,
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`Template ${template.index}: ${template.holdings.map((h) => h.symbol).join(', ')}`);
  }

  console.log(`\nSeeded ${templates.length} mock portfolio templates.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
