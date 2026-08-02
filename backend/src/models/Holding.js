const mongoose = require('mongoose');

// A single holding owned by a user. Price/value are computed live from
// Yahoo Finance at read time (see marketService) — only the "purchase"
// facts (what, how much, at what price) are persisted here.
const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['equity', 'mf', 'gold'], required: true },
    exchange: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Holding', holdingSchema);
