require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Holding = require('../models/Holding');
const MockPortfolioTemplate = require('../models/MockPortfolioTemplate');

const assignRandomMockPortfolio = async (userId) => {
  const templateCount = await MockPortfolioTemplate.countDocuments();
  if (templateCount === 0) {
    console.log('No templates found.');
    return;
  }

  const randomIndex = Math.floor(Math.random() * templateCount);
  const template = await MockPortfolioTemplate.findOne().skip(randomIndex);
  if (!template) return;

  const holdings = template.holdings.map((h) => ({
    user: userId,
    symbol: h.symbol,
    name: h.name,
    category: h.category,
    exchange: h.exchange,
    quantity: h.quantity,
    avgBuyPrice: h.avgBuyPrice,
  }));

  await Holding.insertMany(holdings);
  console.log(`Assigned template ${template.index} to user ${userId}`);
};

async function main() {
  await connectDB();

  const users = await User.find();
  console.log(`Found ${users.length} users in database.`);

  for (const user of users) {
    const holdingCount = await Holding.countDocuments({ user: user._id });
    if (holdingCount === 0) {
      console.log(`User ${user.email} (${user._id}) has 0 holdings. Assigning a mock portfolio...`);
      await assignRandomMockPortfolio(user._id);
    } else {
      console.log(`User ${user.email} (${user._id}) already has ${holdingCount} holdings.`);
    }
  }

  console.log('Done fixing users.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
