const mongoose = require('mongoose');

// One of 10 pre-seeded, realistic mock portfolios (real Yahoo Finance
// symbols/names, fake ownership) — see scripts/seedMockPortfolios.js.
// A fresh copy of one template's holdings array is assigned to each new
// user at registration time (see userController.syncUser).
const templateHoldingSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['equity', 'mf', 'gold'], required: true },
    exchange: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const mockPortfolioTemplateSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, unique: true },
    holdings: { type: [templateHoldingSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MockPortfolioTemplate', mockPortfolioTemplateSchema);
